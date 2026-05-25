# 360° Feedback — Target's View Implementation Plan

> Scope: define exactly what a feedback receiver (target) sees when opening their own 360° report, and how the system enforces anonymity for peer/subordinate feedback while showing manager and self feedback in full.

---

## 0. The Rule (One Sentence)

> The target sees **content for every relationship**, but **identities only for Self and Direct Manager**. Peer and Subordinate feedback is **always pooled, anonymized, and suppressed** when fewer than the threshold number of submissions exist.

---

## 1. What the Target Sees by Relationship

| Relationship | Show as individual form? | Identity? | Score visible | Comments visible |
|---|---|---|---|---|
| **Self** | Yes — their own responses | Themselves | All questions | All their own comments |
| **Direct Manager** | Yes — full per-question form | Manager's real name | All questions with score + comment | Manager's full comment text, attributed |
| **Peer** | **No** — pooled only | "Anonymous" | Per-category averages only | Shuffled, anonymized, suppressed if < 3 submissions |
| **Subordinate** | **No** — pooled only | "Anonymous" | Per-category averages only | Shuffled, anonymized, suppressed if < 3 submissions |

**Why this split:**

- **Self / Manager are accountable** — the target knows who they are. Showing full forms is fair and transparent.
- **Peer / Subordinate need anonymity** — without it, honest critical feedback dries up. Pooling + shuffling + suppression prevents the target from attributing any individual comment to any individual evaluator.

---

## 2. Affected Files

**Backend (4 files):**

1. `service/feedback360/impl/FeedbackSubmissionServiceImpl.java` — `getFeedbackReceivedByEmployee`
2. `service/feedback360/impl/FeedbackReportServiceImpl.java` — `getFeedbackSummary`
3. `controller/feedback360/FeedbackSubmissionController.java` — `getReceivedByEmployee` endpoint
4. `dto/feedback360/FeedbackSummaryResponse.java` — add `pooledPeerFeedback`, `pooledSubordinateFeedback` sections; add `suppressed` flag

**Frontend (1 file):**

5. `pages/feedback360/Feedback360ReportPage.tsx` — add **"Individual Submissions"** section + **"Pooled Feedback"** sections

---

## 3. Backend Changes

### 3.1 Filter `getFeedbackReceivedByEmployee` by relationship and viewer

When the **target opens their own** received-feedback list, only return SELF and DIRECT_MANAGER as individual rows. HR or admin viewing audits sees everything.

```java
@Override
public List<FeedbackDetailsResponse> getFeedbackReceivedByEmployee(Long employeeId, Long cycleId) {
    Long viewerId = securityHelper.currentUserId();
    boolean isTargetViewingSelf = viewerId != null && viewerId.equals(employeeId);
    boolean isPrivileged = securityHelper.hasAnyRole("HR", "ADMIN") && !isTargetViewingSelf;

    return feedbackRepository
            .findByRequestTargetUserIdAndRequestCycleCycleId(employeeId, cycleId)
            .stream()
            .filter(f -> {
                FeedbackRelationship rel = f.getRequest().getRelationship();
                if (isPrivileged) return true;             // HR audit — see all
                if (isTargetViewingSelf) {
                    return rel == FeedbackRelationship.SELF
                        || rel == FeedbackRelationship.DIRECT_MANAGER;
                }
                return false;                              // anyone else — see nothing
            })
            .map(f -> toFeedbackDetails(f, viewerId))
            .collect(Collectors.toList());
}
```

The endpoint stops being a "see everything about you" leak — it becomes "see what you're allowed to see".

### 3.2 Pool peer / subordinate in `getFeedbackSummary`

`FeedbackReportServiceImpl.getFeedbackSummary` already returns per-category averages by relationship. Extend the response with two new pooled sections, and apply the suppression threshold.

Add to `FeedbackSummaryResponse`:

```java
private PooledFeedbackSection pooledPeerFeedback;        // null when suppressed
private PooledFeedbackSection pooledSubordinateFeedback; // null when suppressed
private Integer suppressionThreshold;                    // typically 3
```

New DTO:

```java
@Data @Builder
public class PooledFeedbackSection {
    private int submissionCount;             // e.g., 3
    private List<CategoryScore> averages;    // per-category pooled averages
    private List<String> shuffledComments;   // shuffled, no evaluator attribution
    private boolean suppressed;              // true if submissionCount < threshold
    private String suppressionMessage;       // e.g., "Suppressed — fewer than 3 submissions"
}
```

Backend logic:

```java
int threshold = scoringPolicyRepo
        .findByCycleAndJobLevel(cycle, target.getLevel())
        .orElseGet(() -> scoringPolicyRepo.findCycleDefault(cycle))
        .getSuppressionThreshold();

PooledFeedbackSection peerPool = buildPool(
    feedbacks, FeedbackRelationship.PEER, threshold);
PooledFeedbackSection subPool = buildPool(
    feedbacks, FeedbackRelationship.SUBORDINATE, threshold);

private PooledFeedbackSection buildPool(
        List<Feedback> all, FeedbackRelationship rel, int threshold) {
    List<Feedback> group = all.stream()
            .filter(f -> f.getRelationship() == rel)
            .collect(Collectors.toList());
    int count = group.size();
    boolean suppressed = count < threshold;
    if (suppressed) {
        return PooledFeedbackSection.builder()
                .submissionCount(count)
                .suppressed(true)
                .suppressionMessage(
                    "Suppressed — fewer than " + threshold + " submissions to protect anonymity")
                .build();
    }
    List<CategoryScore> averages = computeCategoryAverages(group);
    List<String> comments = group.stream()
            .flatMap(f -> responseRepo.findByFeedbackId(f.getId()).stream())
            .map(FeedbackResponse::getComment)
            .filter(c -> c != null && !c.isBlank())
            .collect(Collectors.toList());
    Collections.shuffle(comments);  // identity-leakage prevention
    return PooledFeedbackSection.builder()
            .submissionCount(count)
            .averages(averages)
            .shuffledComments(comments)
            .suppressed(false)
            .build();
}
```

### 3.3 Force-pool peer/sub even when explicit `isAnonymous = false`

Defensive: even if a peer request was accidentally marked non-anonymous, the target still sees pooled output, never individual form. The `getFeedbackReceivedByEmployee` filter from §3.1 already blocks PEER/SUBORDINATE from the individual-rows path — the pooled section in §3.2 is the only way the target sees this data.

### 3.4 HR / admin audit view

HR/admin needs the individual peer/subordinate forms for audit and reassignment purposes. Use a separate endpoint instead of overloading the target endpoint:

```java
@GetMapping("/audit/employee/{employeeId}")
@PreAuthorize("hasAnyRole('HR','ADMIN')")
public ResponseEntity<List<FeedbackDetailsResponse>> auditByEmployee(
        @PathVariable Long employeeId, @RequestParam Long cycleId) {
    return ResponseEntity.ok(feedbackService.getAllFeedbackForAudit(employeeId, cycleId));
}
```

This endpoint:
- Returns every individual submission with real names
- Is **not** callable by the target themselves (even if they have HR role)
- Should be logged in the audit trail (who viewed whose feedback, when)

To enforce "even HR cannot see their own peer/sub forms", add a guard in `getAllFeedbackForAudit`:

```java
public List<FeedbackDetailsResponse> getAllFeedbackForAudit(Long employeeId, Long cycleId) {
    Long viewerId = securityHelper.currentUserId();
    if (viewerId != null && viewerId.equals(employeeId)) {
        throw new ForbiddenException(
            "You cannot audit your own peer/subordinate feedback. "
          + "Ask another HR member.");
    }
    // ...return full list
}
```

---

## 4. Frontend Changes

### 4.1 New layout sections on `Feedback360ReportPage.tsx`

After the existing headline + radar + bar charts, add three new sections in this order:

1. **Self vs Others Gap** (already planned in earlier doc)
2. **Individual Submissions** — Manager and Self forms, expandable per-question
3. **Pooled Peer Feedback** — averages + anonymous comments
4. **Pooled Subordinate Feedback** — averages + anonymous comments

```tsx
{/* --- Individual Submissions: Manager + Self only --- */}
{individualSubmissions.length > 0 && (
  <section style={panel}>
    <h3 style={sectionTitle}>Individual Submissions</h3>
    {individualSubmissions.map((sub) => (
      <ExpandableSubmissionCard key={sub.feedbackId} submission={sub} />
    ))}
  </section>
)}

{/* --- Pooled Peer Feedback --- */}
<section style={panel}>
  <h3 style={sectionTitle}>
    Peer Feedback
    <span style={muted}> ({summary.pooledPeerFeedback?.submissionCount ?? 0} submissions)</span>
  </h3>
  {summary.pooledPeerFeedback?.suppressed ? (
    <SuppressionNotice message={summary.pooledPeerFeedback.suppressionMessage} />
  ) : (
    <>
      <CategoryAverageTable rows={summary.pooledPeerFeedback?.averages ?? []} />
      <AnonymousCommentList comments={summary.pooledPeerFeedback?.shuffledComments ?? []} />
    </>
  )}
</section>

{/* --- Pooled Subordinate Feedback --- */}
<section style={panel}>
  <h3 style={sectionTitle}>
    Subordinate Feedback
    <span style={muted}> ({summary.pooledSubordinateFeedback?.submissionCount ?? 0} submissions)</span>
  </h3>
  {summary.pooledSubordinateFeedback?.suppressed ? (
    <SuppressionNotice message={summary.pooledSubordinateFeedback.suppressionMessage} />
  ) : (
    <>
      <CategoryAverageTable rows={summary.pooledSubordinateFeedback?.averages ?? []} />
      <AnonymousCommentList comments={summary.pooledSubordinateFeedback?.shuffledComments ?? []} />
    </>
  )}
</section>
```

### 4.2 `ExpandableSubmissionCard` design

For Manager and Self individual submissions:

```tsx
<div style={card}>
  <div style={cardHeader}>
    <RelBadge rel={submission.relationship} />
    <span style={evaluatorName}>{submission.evaluatorName}</span>
    <span style={avgScore}>{submission.averageScore?.toFixed(1) ?? '—'}</span>
    <button onClick={() => setExpanded(!expanded)}>{expanded ? 'Hide' : 'Show'} questions</button>
  </div>
  {expanded && (
    <div style={questionList}>
      {submission.responses.map((r) => (
        <div key={r.questionId} style={questionRow}>
          <p>{r.questionText}</p>
          <div style={questionMeta}>
            <span>Score: {r.score ?? '—'}/5</span>
            {r.comment && <p style={comment}>{r.comment}</p>}
          </div>
        </div>
      ))}
      {submission.overallComment && (
        <div style={overallBlock}>
          <strong>Overall comment:</strong> {submission.overallComment}
        </div>
      )}
    </div>
  )}
</div>
```

### 4.3 `AnonymousCommentList` design

```tsx
<div>
  <p style={muted}>Comments are shuffled to protect anonymity. No name or order shown.</p>
  <ul style={commentList}>
    {comments.map((c, i) => (
      <li key={i} style={commentItem}>
        <Quote size={12} style={iconMuted} /> {c}
      </li>
    ))}
  </ul>
</div>
```

### 4.4 `SuppressionNotice` design

```tsx
<div style={noticeBox}>
  <Lock size={14} />
  <p>{message}</p>
  <p style={muted}>
    To protect evaluator anonymity, this section is hidden until at least 3 evaluators submit feedback.
  </p>
</div>
```

### 4.5 RTK Query — split endpoints clearly

In `feedback360Api.ts`, ensure the two endpoints are distinct:

```typescript
// Target's view — pooled + own-manager only
getMyReceivedFeedback: builder.query<FeedbackDetailsResponse[], number>({
  query: (cycleId) => `/360-feedback/feedbacks/employee/me?cycleId=${cycleId}`,
  transformResponse: (res: ApiResponse<FeedbackDetailsResponse[]>) => res.data,
}),

// HR audit view — full individual submissions (privileged)
getAuditFeedback: builder.query<FeedbackDetailsResponse[], { employeeId: number; cycleId: number }>({
  query: ({ employeeId, cycleId }) => `/360-feedback/feedbacks/audit/employee/${employeeId}?cycleId=${cycleId}`,
  transformResponse: (res: ApiResponse<FeedbackDetailsResponse[]>) => res.data,
}),
```

The target page uses the first; HR audit dashboard (Phase 3) uses the second.

---

## 5. Manual Test Plan

Setup: cycle 4 has Daw Khin Khin as a target with: 1 Self + 1 Manager (U Kyaw Kyaw) + 4 Peers + 2 Subordinates. Suppression threshold = 3.

| # | Action | Expected outcome |
|---|---|---|
| 1 | Log in as **Daw Khin Khin** (target). Open `/360-feedback/my-report` | "Individual Submissions" shows 2 cards: Self and U Kyaw Kyaw. No peer/subordinate individual rows anywhere. |
| 2 | Expand U Kyaw Kyaw's card | Per-question scores + comments + overall comment visible with U Kyaw Kyaw's name attributed. |
| 3 | View "Pooled Peer Feedback" | Shows "4 submissions", category averages table, list of shuffled comments labeled "Anonymous". No names, no order. |
| 4 | View "Pooled Subordinate Feedback" | Shows "2 submissions — Suppressed (fewer than 3)". No scores, no comments, only the lock icon + message. |
| 5 | Open DevTools → Network → check `/360-feedback/feedbacks/employee/me?cycleId=4` response | Body contains 2 entries (Self + Manager). PEER and SUBORDINATE entries NOT present. |
| 6 | Open `/360-feedback/feedbacks/audit/employee/<her id>?cycleId=4` via Postman (logged in as her) | Returns 403 — cannot audit her own feedback. |
| 7 | Log in as another HR (not the target). Hit the audit endpoint for Daw Khin Khin | Returns all 7 individual submissions with names. |
| 8 | Reduce peer submissions to 2 (cancel 2 of the 4) and regenerate summary | Peer section flips to suppressed; scores and comments hidden. |

If any step fails, the rule is not enforced somewhere.

---

## 6. Edge Cases Handled

- **Single manager**: 1 manager submission → individual card shown. Manager isn't anonymous so no suppression needed.
- **No manager (L04 target)**: no Manager card. Page shows "No manager feedback this cycle" placeholder.
- **L07 target with no subordinates**: Subordinate section shows "No subordinate feedback this cycle" — not "Suppressed". Different message.
- **One peer left after others cancelled**: section shows suppressed. Comment that one peer wrote is hidden.
- **Target is also HR**: same target rules apply — they see pooled view of their own peers, NEVER individual peer forms. Even using the audit endpoint blocks (§3.4 guard).

---

## 7. Rollout Order

1. Backend §3.1 — filter `getFeedbackReceivedByEmployee` by relationship. **10 min.**
2. Backend §3.2 — add `PooledFeedbackSection` DTO + pool logic in `getFeedbackSummary`. **30 min.**
3. Backend §3.4 — new `/audit/employee/{id}` endpoint with self-block guard. **15 min.**
4. Frontend §4.1–4.4 — Individual Submissions section + Pooled sections + Suppression notice + Anonymous comment list. **45 min.**
5. Frontend §4.5 — split RTK queries cleanly. **10 min.**
6. Manual test pass §5. **15 min.**

**Total: ~2 hours.**

---

## 8. Rollback Plan

All changes are additive — new DTO fields, new endpoint, new UI sections. To revert:

- Backend: revert the 4 service/controller files. The target endpoint stops filtering and returns everything (back to the pre-fix leak). The pooled fields in `FeedbackSummaryResponse` go to null and the FE handles it gracefully.
- Frontend: revert `Feedback360ReportPage.tsx`. The old per-relationship summary view (which already exists) keeps working.
- No DB migration; no data to undo.

---

## 9. Related Plans

- **`360_FEEDBACK_ANONYMITY_FIX_PLAN.md`** — the viewer-aware mask on the admin-side preview / saved list. Same rule, different surface.
- **`360_FEEDBACK_MODIFIED_IMPLEMENTATION_PLAN.md`** Bug 3 — anonymity hardcoded by relationship. This plan implements the proper read-layer enforcement on the target's report.
- **`360_FEEDBACK_CALIBRATION_WORKFLOW_PLAN.md`** — calibration uses the same `FeedbackSummaryResponse`. After calibration, the calibrated score shows on the headline. Pooled comments still come from raw submissions.

Apply Phase 1 fixes from the modified plan first; this target-view enforcement is the third layer on top of the corrected baseline (after the admin-anonymity fix and the summary deflation fix).
