# 360° Feedback — Reassign / Cancel Fix Implementation Plan

> Scope: make Reassign and Cancel buttons work on the admin preview table.
> Root cause: the admin table shows **preview rows** (no DB `id` because they were never persisted). Reassign/Cancel call `POST /feedback/request/{undefined}/...` which 404s.

---

## Goal

After clicking **Generate Requests**, switch the table from preview data to **persisted rows** that carry real `id` values, so Reassign and Cancel work. Also handle the initial-page-load case (admin reopens the page after generation has already happened).

---

## Affected Files

**Backend (3 files):**
1. `service/feedback360/FeedbackRequestService.java`
2. `service/feedback360/impl/FeedbackRequestServiceImpl.java`
3. `controller/feedback360/Feedback360Controller.java`

**Frontend (2 files):**
4. `features/feedback360/feedback360Api.ts`
5. `pages/feedback360/Feedback360AdminPage.tsx`

**Verify (1 file, no change expected):**
6. `mapper/FeedbackMapper.java` — confirm `toRequestResponse` maps `id`.

---

## Backend Changes

### 1. `FeedbackRequestService.java` — add interface method

Add this new method signature alongside the existing ones:

```java
List<FeedbackRequestResponse> listByCycle(Long cycleId);
```

Order it next to other read methods like `getMyPendingRequests`.

### 2. `FeedbackRequestServiceImpl.java` — implement it

Add this method (place it after `reassignFeedbackRequest`, before the commented-out block at line 590):

```java
@Override
public List<FeedbackRequestResponse> listByCycle(Long cycleId) {
    return requestRepository.findByCycleCycleId(cycleId).stream()
            .map(feedbackMapper::toRequestResponse)
            .collect(Collectors.toList());
}
```

**Notes:**
- `findByCycleCycleId` already exists in `FeedbackRequestRepository` — it's used elsewhere in the same file (line 85, line 101, line 130, line 151).
- `feedbackMapper.toRequestResponse` already exists and includes the `id` field (verify in step 6).

### 3. `Feedback360Controller.java` — expose the endpoint

Add this near the existing cancel/reassign endpoints (around line 137, after the reassign mapping):

```java
@GetMapping("/cycle/{cycleId}/requests")
@PreAuthorize("hasAnyRole('ADMIN','HR')")
public ResponseEntity<ApiResponse<List<FeedbackRequestResponse>>> listByCycle(@PathVariable Long cycleId) {
    return ResponseEntity.ok(ApiResponse.success(feedbackRequestService.listByCycle(cycleId)));
}
```

Resulting URL: `GET /api/v1/feedback/cycle/{cycleId}/requests`.

---

## Frontend Changes

### 4. `feedback360Api.ts` — add the query hook

Add this endpoint in the `injectEndpoints` block (next to the existing `previewFeedbackRequests`):

```typescript
listRequestsByCycle: builder.query<FeedbackRequestResponse[], number>({
  query: (cycleId) => `/feedback/cycle/${cycleId}/requests`,
  transformResponse: (res: ApiResponse<FeedbackRequestResponse[]>) => res.data,
  providesTags: ['Feedback360Request' as any],
}),
```

Export the hook at the bottom of the file:

```typescript
export const {
  // ... existing exports
  useListRequestsByCycleQuery,
} = feedback360Api;
```

Because `cancelFeedbackRequest`, `reassignFeedbackRequest`, `generateFeedbackRequests`, and `regenerateUserRequests` all already `invalidatesTags: ['Feedback360Request']`, this query auto-refetches after every mutation — no extra wiring needed.

### 5. `Feedback360AdminPage.tsx` — swap data source

**Add imports:**

```tsx
import {
  // ... existing
  useListRequestsByCycleQuery,
} from '../../features/feedback360/feedback360Api';
```

**Inside the component:**

```tsx
const [hasGenerated, setHasGenerated] = useState(false);

const { data: savedRequests = [] } = useListRequestsByCycleQuery(
  Number(cycleId),
  { skip: !cycleId }
);

// Default to "saved view" if rows already exist for this cycle
useEffect(() => {
  if (savedRequests.length > 0) setHasGenerated(true);
}, [savedRequests.length]);
```

**After Generate succeeds**, flip the flag:

```tsx
const handleGenerate = async () => {
  try {
    await generateRequests({ cycleId, ... }).unwrap();
    toast.success('Requests generated.');
    setHasGenerated(true);          // ← add this line
  } catch (e) { ... }
};
```

**Choose which dataset feeds the table:**

```tsx
const rows: FeedbackRequestResponse[] = hasGenerated ? savedRequests : (previewData ?? []);
```

**Disable Reassign/Cancel when row has no `id`** (defensive guard, even after the swap):

In `PreviewRow` (around line 481), wrap the action buttons:

```tsx
<button
  style={smBtn('neutral')}
  onClick={onReassign}
  disabled={!req.id}
  title={!req.id ? 'Click Generate to enable per-row actions' : undefined}
>
  <Edit3 size={10} /> Reassign
</button>
```

Same treatment for the Cancel button.

**Optional UX polish** — show a small banner above the table when in preview mode:

```tsx
{!hasGenerated && rows.length > 0 && (
  <div style={{ background: '#FFFBEB', border: '0.5px solid #FDE68A', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400E', marginBottom: 12 }}>
    Preview mode — click <strong>Generate Requests</strong> to persist these rows. Reassign and Cancel are disabled until then.
  </div>
)}
```

---

## Verification Step (Mapper)

Open `mapper/FeedbackMapper.java` and confirm `toRequestResponse` maps the `id` field. With MapStruct + matching field name (`FeedbackRequest.id` → `FeedbackRequestResponse.id`), it's auto-mapped. If not, add:

```java
@Mapping(target = "id", source = "id")
FeedbackRequestResponse toRequestResponse(FeedbackRequest request);
```

If `FeedbackRequestResponse.id` is missing entirely, add it:

```java
public class FeedbackRequestResponse {
    private Long id;
    // ...existing fields
}
```

---

## Manual Test Plan

**Backend smoke test (Postman):**

1. `POST /api/v1/feedback/generate?cycleId=1&globalMaxLimit=10&excludeLongTermLeave=false` → 200 OK.
2. `GET /api/v1/feedback/cycle/1/requests` → 200 OK, array of rows, each with `"id": <number>`.
3. Pick a row id, `POST /api/v1/feedback/request/{id}/reassign` body `{"newEvaluatorId": <other employee id>}` → 200 OK, "Feedback request reassigned".
4. `GET /api/v1/feedback/cycle/1/requests` again → confirm `evaluatorId` on that row changed and `status` is back to PENDING.

**Frontend e2e:**

5. Open `/360-feedback/admin`, pick a cycle.
6. Click **Preview** → rows appear with **Preview mode** banner, Reassign/Cancel disabled.
7. Click **Generate Requests** → toast success, banner disappears, rows now show real `id` (use DevTools to verify), Reassign/Cancel buttons enabled.
8. Click **Reassign** on a Fallback row → modal opens → enter new employee ID → confirm → toast "Request reassigned" → table refetches → row shows new evaluator and PENDING status.
9. Click **Cancel** on another row → confirmation → toast "Cancelled" → row shows CANCELLED status.
10. Refresh the page → table loads the saved rows directly (no preview needed).

---

## Rollback Plan

The changes are additive — no schema migration, no behavior change for existing endpoints. If a problem appears in production:

- **Backend rollback:** revert the three files; the new `GET /cycle/{cycleId}/requests` simply disappears. Existing preview/generate flows continue to work.
- **Frontend rollback:** revert `Feedback360AdminPage.tsx` to use preview only; Reassign/Cancel return to the broken state but no other regression.

---

## Estimated Time

- Backend (3 files): ~5 minutes including testing.
- Frontend (2 files): ~10 minutes including verifying autosave/cache invalidation.
- Manual test: ~5 minutes.

**Total: ~20 minutes.**
