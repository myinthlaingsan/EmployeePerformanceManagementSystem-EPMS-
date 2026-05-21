# 360° Feedback — Anonymity Fix Plan

> Scope: enforce viewer-aware anonymity across all 360° read paths so peer/subordinate evaluator identities are never exposed to the target — including when the target is HR or an admin.

---

## 0. The Bug in One Sentence

When HR (Daw Khin Khin) generates the 360 cycle and views the admin assignments list, she can see the names of her own anonymous peers and subordinates because the backend returns raw evaluator names without checking whether the viewer is the target.

This breaks the only piece of psychological safety that makes 360 feedback work.

---

## 1. The Rule (No Exceptions)

For every API response that includes evaluator identity, apply this filter:

```
if viewer.id == target.id
   AND request.isAnonymous == true
   AND relationship IN (PEER, SUBORDINATE)
then
   evaluator.id   = null
   evaluator.name = "Anonymous"
```

This rule is applied **regardless of viewer role**. HR, admin, and the target themselves all get the masked view when they are the target. Only when HR/admin views *someone else's* row do they see real names (for audit / reassign).

| Viewer | Target | Relationship | Anonymous? | Names visible? |
|---|---|---|---|---|
| Anyone | Self | Self | n/a | Yes (it's themselves) |
| Target | Target | Direct Manager | No | Yes (they know their manager) |
| Target | Target | **Peer** | Yes | **No** — "Anonymous" |
| Target | Target | **Subordinate** | Yes | **No** — "Anonymous" |
| HR (≠ target) | Other employee | Any | Any | Yes (audit) |
| HR (= target) | HR herself | Peer / Subordinate | Yes | **No** — must respect anonymity |

---

## 2. Affected Files

**Backend (5 files):**

1. `mapper/FeedbackMapper.java`
2. `service/feedback360/impl/FeedbackRequestServiceImpl.java` (preview + listByCycle paths)
3. `service/feedback360/impl/FeedbackReportServiceImpl.java` (per-employee report)
4. `service/feedback360/impl/FeedbackSubmissionServiceImpl.java` (received feedback)
5. `controller/feedback360/Feedback360Controller.java` (reassign/cancel guards)

**Frontend (1 file, defense in depth):**

6. `pages/feedback360/Feedback360AdminPage.tsx`

---

## 3. Backend Changes

### 3.1 Add a viewer-aware mapper overload

In `FeedbackMapper.java` (or a new `AnonymityHelper` if MapStruct):

```java
public FeedbackRequestResponse toRequestResponse(FeedbackRequest req, Long viewerId) {
    boolean mask = shouldMaskEvaluator(req, viewerId);
    return FeedbackRequestResponse.builder()
            .id(req.getId())
            .targetUserId(req.getTargetUser().getId())
            .targetUserName(req.getTargetUser().getStaffName())
            .targetDepartmentName(...)
            .evaluatorId(mask ? null : req.getEvaluator().getId())
            .evaluatorName(mask ? "Anonymous" : req.getEvaluator().getStaffName())
            .evaluatorDepartmentName(mask ? null : ...)
            .relationship(req.getRelationship())
            .status(req.getStatus())
            .isAnonymous(req.getIsAnonymous())
            .build();
}

public static boolean shouldMaskEvaluator(FeedbackRequest req, Long viewerId) {
    if (viewerId == null) return false;
    boolean viewerIsTarget = viewerId.equals(req.getTargetUser().getId());
    if (!viewerIsTarget) return false;
    if (!Boolean.TRUE.equals(req.getIsAnonymous())) return false;
    FeedbackRelationship rel = req.getRelationship();
    return rel == FeedbackRelationship.PEER || rel == FeedbackRelationship.SUBORDINATE;
}
```

Keep the existing `toRequestResponse(FeedbackRequest)` overload (without viewer) only for internal use — never call it from a controller-facing service.

### 3.2 Add a security context helper

Create `service/feedback360/SecurityHelper.java`:

```java
@Component
@RequiredArgsConstructor
public class SecurityHelper {
    private final EmployeeRepository employeeRepository;

    public Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof UserDetails ud) {
            return employeeRepository.findByUsername(ud.getUsername())
                    .map(Employee::getId).orElse(null);
        }
        return null;
    }
}
```

Adjust the principal-to-employee resolution to match your existing auth setup (if you already have `@AuthenticationPrincipal CurrentUser`, prefer that).

### 3.3 Apply mask in preview generation

In `FeedbackRequestServiceImpl.handleRequest` (the preview branch), replace the direct field copy with the mapper call. But preview uses an in-memory list, not entities — so use a helper:

```java
private FeedbackRequestResponse buildPreviewResponse(
        Employee target, Employee evaluator, FeedbackRelationship rel,
        FeedbackStatus status, boolean isAnonymous, boolean isReciprocal,
        Long viewerId) {

    boolean mask = viewerId != null
            && viewerId.equals(target.getId())
            && isAnonymous
            && (rel == FeedbackRelationship.PEER || rel == FeedbackRelationship.SUBORDINATE);

    return FeedbackRequestResponse.builder()
            .targetUserId(target.getId())
            .targetUserName(target.getStaffName())
            .targetDepartmentName(deptOf(target))
            .evaluatorId(mask ? null : evaluator.getId())
            .evaluatorName(mask ? "Anonymous" : evaluator.getStaffName())
            .evaluatorDepartmentName(mask ? null : deptOf(evaluator))
            .relationship(rel)
            .status(status)
            .isAnonymous(isAnonymous)
            .isReciprocalFallback(isReciprocal)
            .build();
}
```

Replace the existing preview-list `previewResults.add(...)` calls in `handleRequest` with `previewResults.add(buildPreviewResponse(..., securityHelper.currentUserId()))`.

### 3.4 Apply mask in `listByCycle`

```java
@Override
public List<FeedbackRequestResponse> listByCycle(Long cycleId) {
    Long viewerId = securityHelper.currentUserId();
    return requestRepository.findByCycleCycleId(cycleId).stream()
            .map(req -> feedbackMapper.toRequestResponse(req, viewerId))
            .collect(Collectors.toList());
}
```

### 3.5 Apply mask in `FeedbackReportServiceImpl.getFeedbackSummary`

Replace the existing hardcoded-by-relationship logic (line ~54) with a viewer-aware variant. The viewer here is fetched once:

```java
Long viewerId = securityHelper.currentUserId();

for (Feedback feedback : allFeedbacks) {
    boolean mask = viewerId != null
            && viewerId.equals(feedback.getRequest().getTargetUser().getId())
            && Boolean.TRUE.equals(feedback.getRequest().getIsAnonymous())
            && (feedback.getRelationship() == FeedbackRelationship.PEER
             || feedback.getRelationship() == FeedbackRelationship.SUBORDINATE);
    String evaluatorName = mask
            ? "Anonymous"
            : feedback.getRequest().getEvaluator().getStaffName();
    // ...rest unchanged
}
```

### 3.6 Apply mask in `FeedbackSubmissionServiceImpl.getFeedbackReceivedByEmployee`

This endpoint returns full feedback to the target. Make sure the response builder filters evaluator identity using the same rule. Typically the `FeedbackDetailsResponse` should never expose `evaluatorName` for anonymous peer/subordinate rows when fetched by the target — apply the same `shouldMaskEvaluator` check before populating the DTO.

### 3.7 Guard the Reassign endpoint

In `Feedback360Controller.reassignRequest` (or the service it delegates to):

```java
public void reassignFeedbackRequest(Long requestId, Long newEvaluatorId) {
    FeedbackRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new NotFoundException("Feedback request not found"));
    Long viewerId = securityHelper.currentUserId();

    boolean selfTarget = viewerId != null
            && viewerId.equals(request.getTargetUser().getId());
    boolean anonRel = Boolean.TRUE.equals(request.getIsAnonymous())
            && (request.getRelationship() == FeedbackRelationship.PEER
             || request.getRelationship() == FeedbackRelationship.SUBORDINATE);

    if (selfTarget && anonRel) {
        throw new ForbiddenException(
            "You cannot reassign your own anonymous evaluators. "
          + "Ask another HR member or admin.");
    }
    // ...existing reassign logic
}
```

Add the same guard to Cancel for consistency.

---

## 4. Frontend Changes

### 4.1 Defense in depth — mask in `Feedback360AdminPage.tsx`

Even if the API ever leaks the name, the UI hides it. In `PreviewRow`:

```tsx
const { user } = useAuth();

const isMyRow = req.targetUserId === user?.id;
const shouldHide = isMyRow
  && req.isAnonymous
  && (req.relationship === 'PEER' || req.relationship === 'SUBORDINATE');

return (
  <tr ...>
    <td>{req.targetUserName}</td>
    <td>{shouldHide ? 'Anonymous' : req.evaluatorName}</td>
    <td><RelBadge rel={req.relationship} /></td>
    {/* ...rest unchanged */}
    <td>
      {!cycleLocked && (
        <div style={{ display: 'flex', gap: 4 }}>
          <button ...>Regen</button>
          {!isDone && (
            <>
              <button
                disabled={shouldHide}
                title={shouldHide ? 'Cannot reassign your own anonymous evaluator' : undefined}
                onClick={onReassign}
              >Reassign</button>
              <button
                disabled={shouldHide}
                title={shouldHide ? 'Cannot cancel your own anonymous evaluator request' : undefined}
                onClick={onCancel}
              >Cancel</button>
            </>
          )}
        </div>
      )}
    </td>
  </tr>
);
```

The Reassign/Cancel buttons are visually disabled with a tooltip when the row is the user's own anonymous evaluator — confirming the backend guard from §3.7.

### 4.2 Same masking on the per-employee report page

`Feedback360ReportPage.tsx` already shows comments grouped by relationship. Verify the rendered `evaluatorName` always equals "Anonymous" for PEER/SUBORDINATE (the backend masking from §3.5 should already deliver this). Remove any client-side decoration that prepends the role to the name (e.g., "Anonymous PEER" → just "Anonymous", since the role badge is shown separately).

---

## 5. Manual Test Plan

Setup: log in as Daw Khin Khin (HR + target of cycle 4).

| # | Action | Expected |
|---|---|---|
| 1 | Open `/360-feedback/admin`, click Preview | Daw Khin Khin's own peer/subordinate rows show **"Anonymous"** in the Evaluator column. Other targets' rows show real names. |
| 2 | Click Generate | Same as above on the persisted view. |
| 3 | Click Reassign on a non-Anonymous row (someone else's peer) | Modal opens, reassign succeeds. |
| 4 | Click Reassign on her own Anonymous peer row | Button is **disabled** with tooltip "Cannot reassign your own anonymous evaluator". |
| 5 | Use Postman as Daw Khin Khin to call `POST /api/v1/feedback/request/{her own peer's request id}/reassign` | Backend returns **403 Forbidden** with message about anonymity. |
| 6 | Open `/360-feedback/my-report` | Comments show "Anonymous" for peer/subordinate. Manager and Self comments show real names. |
| 7 | Open `/360-feedback/admin` and view another target (U Myo Min) | All real evaluator names visible (HR's audit access intact). |
| 8 | Log out, log in as a normal employee (e.g., Daw Nilar), open her pending requests | She sees her own pending feedback requests to submit (this is the evaluator view, not the target view — unrelated to the mask). |

If any step fails, the bug is still present somewhere in the layers.

---

## 6. Implementation Order

1. `SecurityHelper.currentUserId()` — depends on your existing auth setup; ~10 min.
2. `FeedbackMapper.toRequestResponse(req, viewerId)` + `shouldMaskEvaluator` helper — ~10 min.
3. `FeedbackRequestServiceImpl.listByCycle` + preview builder — ~15 min.
4. `FeedbackReportServiceImpl.getFeedbackSummary` mask — ~10 min.
5. `FeedbackSubmissionServiceImpl.getFeedbackReceivedByEmployee` mask — ~10 min.
6. Reassign / Cancel guard — ~5 min.
7. Frontend `PreviewRow` + report page masking — ~10 min.
8. Manual test pass — ~15 min.

**Total: ~85 minutes.**

---

## 7. Rollback Plan

All changes are additive (mapper overload, helper component, frontend conditional rendering). To revert:

- Delete `SecurityHelper.java`.
- Revert the 5 backend service/mapper edits.
- Revert the frontend `PreviewRow` edit.

No schema migration; nothing to undo in the DB.

---

## 8. Design Note — Why Not Just Hide HR's Own Row?

You could alternatively filter HR's own row out of the admin table entirely (so they never see their assignments in admin and instead use the regular Report page). Two reasons that's worse:

1. **HR still needs to know their cycle is set up correctly.** Hiding the row means they can't audit "did the system generate my evaluators properly?".
2. **The fix doesn't generalize.** If a manager is also a target (they always are), they need to see their team's rows in the admin/team view — same rule applies to them too. A viewer-aware mask handles everyone uniformly.

The chosen approach — masking the evaluator identity field on rows where the viewer is the target — is the same pattern every enterprise 360 product uses.

---

## 9. Related Plans

- **`360_FEEDBACK_MODIFIED_IMPLEMENTATION_PLAN.md`** Bug 3 — anonymity hardcoded by relationship. This plan implements the proper viewer-aware version end-to-end.
- **`360_FEEDBACK_REASSIGN_FIX_PLAN.md`** — the Reassign/Cancel guard in §3.7 layers on top of that work.
- Apply Phase 1 fixes from the modified plan **first**; this anonymity fix is a single-issue overlay on the corrected baseline.
