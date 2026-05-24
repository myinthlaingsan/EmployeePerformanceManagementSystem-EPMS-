# 360° Feedback — "Could not load form questions" Fix Plan

> Scope: fix the evaluator-side error when the submission modal cannot load form questions for an existing `FeedbackRequest`.
> Symptom: modal shows "Could not load form questions." even though `form_id` IS stored on the request row (verified: row 30, `form_id = 8`).

---

## Root Cause Analysis

The endpoint:

```java
// FeedbackSubmissionController.java:52
@GetMapping("/request/{requestId}/questions")
public ResponseEntity<FullFormResponse> getQuestions(@PathVariable Long requestId) {
    return ResponseEntity.ok(feedbackFormService.getQuestionsForRequest(requestId));
}
```

…calls `FeedbackFormServiceImpl.getQuestionsForRequest`:

```java
public FullFormResponse getQuestionsForRequest(Long requestId) {
    FeedbackRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new NotFoundException("Feedback request not found: " + requestId));
    if (request.getForm() == null) {
        throw new NotFoundException("No form assigned to this feedback request.");
    }
    return formService.getFullForm(request.getForm().getFormId());
}
```

Since `form_id = 8` is stored, the null check passes. The failure must be in `formService.getFullForm(8)` — and the most likely sub-causes are:

1. **Form ID 8 was deleted** (orphan FK from `feedback_request`).
2. **Form ID 8 exists but has no categories** (empty form designer save).
3. **Form ID 8 exists, has categories, but no questions** under those categories.
4. **`getFullForm` throws** for some other reason (e.g., a lazy-load failure on `formSet` or `cycle`).

The frontend swallows the error and shows the generic message. We need to surface the real reason.

---

## Affected Files

**Backend (3 files):**
1. `service/feedback360/impl/FeedbackFormServiceImpl.java`
2. `service/feedback360/impl/FeedbackRequestServiceImpl.java`
3. `controller/feedback360/FeedbackSubmissionController.java`

**Frontend (2 files):**
4. `features/feedback360/feedback360Api.ts`
5. `pages/feedback360/Feedback360PendingPage.tsx`

---

## Backend Changes

### 1. Surface a precise error in `FeedbackFormServiceImpl.getQuestionsForRequest`

Replace the body with explicit, specific exceptions:

```java
@Override
public FullFormResponse getQuestionsForRequest(Long requestId) {
    FeedbackRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new NotFoundException("Feedback request not found: " + requestId));

    if (request.getForm() == null) {
        throw new NotFoundException(
            "Feedback request " + requestId + " has no form assigned. "
          + "Recreate the cycle's FEEDBACK form, then regenerate requests.");
    }

    Long formId = request.getForm().getFormId();
    AppraisalForm form;
    try {
        form = formRepository.findById(formId)
                .orElseThrow(() -> new NotFoundException(
                    "Form " + formId + " referenced by request " + requestId
                  + " no longer exists (orphan FK)."));
    } catch (Exception e) {
        throw new IllegalStateException(
            "Cannot resolve form " + formId + " for request " + requestId
          + ": " + e.getMessage(), e);
    }

    FullFormResponse full = formService.getFullForm(formId);
    if (full.getCategories() == null || full.getCategories().isEmpty()) {
        throw new IllegalStateException(
            "Form " + formId + " has no categories. Add categories and questions in the form designer.");
    }
    boolean hasQuestion = full.getCategories().stream()
            .anyMatch(c -> c.getQuestions() != null && !c.getQuestions().isEmpty());
    if (!hasQuestion) {
        throw new IllegalStateException(
            "Form " + formId + " has no questions. Add at least one question.");
    }
    return full;
}
```

This requires injecting `AppraisalFormRepository`:

```java
private final AppraisalFormRepository formRepository;
```

Effect: when the frontend hits this, the response body now contains a precise reason (orphan FK, empty form, empty categories) instead of a generic `NotFoundException`.

### 2. Guard generation — refuse to create requests with no form

In `FeedbackRequestServiceImpl.process360Generation`, replace the silent `orElse(null)`:

```java
AppraisalForm defaultForm = cycle.getForms().stream()
        .filter(f -> f.getFormType() == FormType.FEEDBACK)
        .findFirst()
        .orElseThrow(() -> new ValidationException(
            "Cycle " + cycleId + " has no FEEDBACK form. "
          + "Create a feedback form for this cycle before generating requests."));
```

Now Generate fails loudly when no form exists — preventing future broken rows.

Also add a runtime check on the form's content (refuse to generate against an empty form):

```java
boolean hasContent = defaultForm.getCategories() != null
        && defaultForm.getCategories().stream()
            .anyMatch(c -> c.getQuestions() != null && !c.getQuestions().isEmpty());
if (!hasContent) {
    throw new ValidationException(
        "Form " + defaultForm.getFormId() + " has no questions. Populate the form first.");
}
```

(Skip this second check if `AppraisalForm.categories` isn't directly accessible via the entity graph — call through `formService.getFullForm(defaultForm.getFormId())` instead.)

### 3. Improve controller error response shape

`FeedbackSubmissionController.getQuestions` currently returns raw `ResponseEntity<FullFormResponse>` — but the global exception handler likely wraps thrown exceptions into `ApiResponse<...>` with a `message`. Confirm the error shape so the frontend can parse it. If there is no global handler, add:

```java
@GetMapping("/request/{requestId}/questions")
public ResponseEntity<ApiResponse<FullFormResponse>> getQuestions(@PathVariable Long requestId) {
    try {
        return ResponseEntity.ok(ApiResponse.success(feedbackFormService.getQuestionsForRequest(requestId)));
    } catch (NotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
    } catch (IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(e.getMessage()));
    }
}
```

(Use whatever `ApiResponse.error(...)` signature your existing code already exposes.)

---

## Frontend Changes

### 4. Stop swallowing the real error in `feedback360Api.ts`

The current `getFormQuestions` uses the loose `transformResponse` helper that masks errors. Replace with a strict typed version:

```typescript
getFormQuestions: builder.query<FullFormResponse, number>({
  query: (requestId) => `/360-feedback/feedbacks/request/${requestId}/questions`,
  transformResponse: (res: ApiResponse<FullFormResponse> | FullFormResponse) => {
    if ('data' in (res as any)) return (res as ApiResponse<FullFormResponse>).data;
    return res as FullFormResponse;
  },
}),
```

(Once the backend wraps consistently with `ApiResponse`, simplify to the typed-only path.)

### 5. Surface the backend message in the modal

In `Feedback360PendingPage.tsx`'s `SubmissionModal`, replace the generic "Could not load form questions" with the actual error from RTK Query:

```tsx
const { data: form, isLoading: formLoading, error: formError } =
  useGetFormQuestionsQuery(request.id);

// ...inside the modal body when there's an error...
{formError && (
  <div style={{ color: '#791F1F', padding: '12px 0' }}>
    <strong>Could not load form questions.</strong>
    <p style={{ marginTop: 6, fontSize: 12, color: '#5A6070' }}>
      {(formError as any)?.data?.message
        ?? (formError as any)?.error
        ?? 'Unknown error. Check that a FEEDBACK form exists for this cycle with at least one question.'}
    </p>
  </div>
)}
```

Now the evaluator (and any HR debugging) sees the precise backend reason: "Form 8 has no questions", "Form 8 no longer exists", etc.

---

## Data Fix for the Current State

Even with the code changes above, your existing broken requests need cleanup.

### Step A — Diagnose form 8

```sql
-- Does form 8 exist?
SELECT form_id, form_name, form_type, cycle_id
FROM appraisal_form
WHERE form_id = 8;

-- Does it have categories + questions?
SELECT fc.category_id, fc.category_name, COUNT(q.question_id) AS q_count
FROM form_category fc
LEFT JOIN questions q ON q.category_id = fc.category_id
WHERE fc.form_id = 8
GROUP BY fc.category_id, fc.category_name;
```

### Step B — Based on the result

| Case | What it means | Fix |
|---|---|---|
| Form 8 missing | Orphan FK on request | Either delete the requests OR repoint them at a real form |
| Form 8 exists but no categories | Empty form | Open form designer for form 8, add categories + questions |
| Form 8 exists with categories but `q_count = 0` | No questions under categories | Add questions in form designer |
| Form 8 fully populated | Likely a JPA lazy-load issue — check Spring logs | Add `@Transactional(readOnly = true)` to `getQuestionsForRequest` |

### Step C — Cleanup script (only if form is gone or empty AND you can't easily edit it)

```sql
-- WARNING: this drops the cycle's feedback. Run only on test data.
DELETE FROM feedback_response WHERE feedback_id IN
  (SELECT id FROM feedback WHERE request_id IN
     (SELECT id FROM feedback_request WHERE cycle_id = <your cycle id>));
DELETE FROM feedback WHERE request_id IN
  (SELECT id FROM feedback_request WHERE cycle_id = <your cycle id>);
DELETE FROM feedback_request WHERE cycle_id = <your cycle id>;
```

Then:
1. Open form designer: `/appraisal-forms/design?type=FEEDBACK&cycleId=<your cycle id>`.
2. Add "Performance Evaluation" category with the 8 criteria as Rating + Text questions.
3. Save.
4. Go to `/360-feedback/admin` → Preview → Generate.

The new requests will have `form_id` pointing at the real, populated form.

---

## Manual Test Plan

**Backend smoke (Postman or browser):**

1. `GET /api/v1/360-feedback/feedbacks/request/30/questions`
   - **Before fix:** generic 404 "No form assigned" OR a Spring exception page.
   - **After fix:** specific message like `"Form 8 has no questions. Add at least one question."`

2. `POST /api/v1/feedback/generate?cycleId=<cycle with no FEEDBACK form>...`
   - **Before fix:** 200 OK, broken rows created.
   - **After fix:** 400 with `"Cycle X has no FEEDBACK form. Create a feedback form for this cycle before generating requests."`

**Frontend e2e:**

3. Log in as an evaluator who has a pending request with the broken form.
4. Click Submit Feedback → modal opens → see the precise backend message (e.g., "Form 8 has no questions.").
5. As HR: create the form properly, regenerate, verify the modal now loads the questions and the 1–5 + Text rows render.

---

## Rollback Plan

All changes are additive or stricter exception messages — no schema changes. To roll back:

- Revert the three backend files; old generic error returns.
- Revert the two frontend files; loose `transformResponse` and generic error message return.

---

## Estimated Time

- Backend (3 files, error-surfacing + guards): ~15 minutes.
- Frontend (2 files, error display): ~10 minutes.
- Data fix + manual test: ~10 minutes.

**Total: ~35 minutes.**
