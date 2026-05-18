# 360° Feedback — Detailed Analysis (Backend + Frontend)

> Scope: end-to-end review of the 360° feedback feature in `epms_backend` and `epms_frontend`, gaps, and what to build for the form-creation page.

---

## Part 1 — What Already Exists

### 1.1 Backend (`epms_backend`)

**Domain model (`model/feedback360/`)**

- `FeedbackRequest` — links target ↔ evaluator for a cycle, with `relationship`, `isAnonymous`, `status`, `form` (FK to `AppraisalForm`).
- `Feedback` — submission record (one per completed `FeedbackRequest`), stores `averageScore`, `overallComment`, `submittedAt`, snapshot of `relationship`.
- `FeedbackResponse` — per-question answer (`score`, `comment`).
- `FeedbackSummary` — aggregated per (employee, cycle): `managerScore`, `peerScore`, `subordinateScore`, `selfScore`, `finalScore`, `totalEvaluators`, `isFinalized`.
- `DepartmentFeedbackConfig` — per (department, jobLevel) min/max peers/subordinates + `allowCrossDepartment`.

**Form & question model (`model/appraisal/`)**

- `AppraisalForm` — formId, formName, `formType` (`MANAGER_EVALUATION` | `SELF_ASSESSMENT` | `FEEDBACK`), cycle, formSet.
- `FormCategory` (a.k.a. section) — groups questions.
- `Question` — questionText, `questionType` (`RATING` | `YESNO` | `TEXT`), `secondaryQuestionType`, `isRequired`.

**Enums**

- `FeedbackRelationship` — `MANAGER`, `PEER`, `SUBORDINATE`, `SELF`, `DIRECT_MANAGER`, `SUPERIOR` (six values; three of them mean "supervisor" — bug source).
- `FeedbackStatus` — `PENDING`, `SUBMITTED`, `COMPLETED` (only PENDING/COMPLETED used; SUBMITTED is dead).
- `FormType` — three values above.
- `QuestionType` — `RATING`, `YESNO`, `TEXT` (no rating-with-required-comment variant).

**Controllers**

- `AppraisalFormController` (`/api/v1/appraisal-forms`) — full form CRUD: create form, add category, add question, get full form, clone form, update/delete form/category/question. Restricted to `ADMIN`/`HR`.
- `QuestionController` (`/api/v1/questions`) — separate CRUD for questions (no auth annotation — gap).
- `feedback360/` controllers: `Feedback360Controller`, `FeedbackRequestController`, `FeedbackSelectionController`, `FeedbackSubmissionController`, `FeedbackSummaryController`, `DepartmentFeedbackConfigController`.

**Services**

- `AppraisalFormServiceImpl` — backs the form CRUD.
- `FeedbackRequestServiceImpl` — generates 360° requests; runs the three-pass peer rotation logic; assigns manager via `ReportingLineRepository`; for L04 targets uses `EvaluatorRotationService.assignTopManagementEvaluator`.
- `FeedbackSubmissionServiceImpl` — accepts submission, computes `averageScore = (totalPoints × 100) / (questionCount × 5)`, flips request to COMPLETED.
- `FeedbackSummaryServiceImpl` — groups feedback by relationship and computes weighted final (hardcoded 0.4/0.3/0.2/0.1; only reads `MANAGER`, ignores `SUPERIOR`/`DIRECT_MANAGER` — Bug 1).
- `FeedbackReportServiceImpl` — produces the per-employee report (radar/bar/comments). Hardcodes anonymity by relationship (Bug 3).
- `FeedbackSelectionServiceImpl` — manual nomination flow (parallel/duplicated logic with `FeedbackRequestService` — Issue 6).
- `FeedbackFormServiceImpl.getQuestionsForRequest(requestId)` — wraps `AppraisalFormService.getFullForm` so evaluators can pull questions for their assigned form.

### 1.2 Frontend (`epms_frontend`)

**Form-creation UI (already exists)**

- `pages/appraisal/AppraisalFormDesign.tsx` (588 lines) — the main form designer. Has `formType` state, accepts `?type=…` and `?cycleId=…` URL params, supports edit mode, library/clone, category + question CRUD. Currently presets for `MANAGER_EVALUATION` and `SELF_ASSESSMENT`; **FEEDBACK is selectable but has no preset wording, no relationship picker, and is not linked from the 360° admin page.**
- `pages/admin/AppraisalFormEditor.tsx` (273 lines) + `AppraisalFormList.tsx` (145 lines) — older admin form pages.
- `components/appraisal/QuestionItem.tsx`, `QuestionRenderer.tsx`, `RatingInput.tsx` — reusable question/rating components.

**360° pages (`pages/feedback360/`)**

- `Feedback360PendingPage.tsx` — evaluator workspace. Lists pending requests, opens `SubmissionModal` with star ratings + comments + overall comment.
- `Feedback360ReportPage.tsx` — target's own report. Score cards (Manager/Peer/Subordinate/Self), radar chart, bar chart, comments.
- `Feedback360AdminPage.tsx` — HR admin. Preview/generate requests, generate all summaries, finalize summaries, regenerate per user.

**API client (`features/feedback360/`)**

- `feedback360Types.ts` — already aligned with the four-source enum (`DIRECT_MANAGER`, `PEER`, `SUBORDINATE`, `SELF`) and four-status enum (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`) — **ahead of the backend** in that respect.
- `feedback360Api.ts` — RTK Query endpoints for the flows above. Has the inconsistent `transformResponse` issue.

**Form CRUD API client (`features/appraisal/appraisalApi.ts`)**

- `useCreateAppraisalFormMutation`, `useAddCategoryMutation`, `useAddQuestionMutation`, `useUpdateAppraisalFormMutation`, `useGetAppraisalFormQuery`, `useGetAppraisalFormsQuery`, `useGetCyclesQuery` — already wired to the backend `AppraisalFormController`.

### 1.3 What is NOT yet built

- No `Competency`, `ScoringPolicy`, `EvaluatorNomination` entities/tables.
- No `targetRelationship` on `AppraisalForm` — one cycle still has one FEEDBACK form for all four sources.
- No `dueDate`, `startedAt`, `lastReminderSentAt`, `IN_PROGRESS` status — drafts and reminders missing.
- No `managerSummary`, `calibratedFinalScore`, `finalizedAt`, `finalizedBy` on `FeedbackSummary` — no calibration step.
- No reminder scheduler, no draft save endpoint, no reassign/cancel endpoints.
- No `FeedbackAccessGuard` — read endpoints have no authz check.
- Frontend: no 360°-specific form-creation entry point, no scoring policy editor, no calibrate modal, no gap-analysis tab.

---

## Part 2 — Step-by-Step 360° Feedback Service Flow

This is what happens today when a full cycle runs. Read top-to-bottom.

**Step 1 — Admin creates a cycle.**
`POST /api/v1/cycles` (handled by `AppraisalCycleController`). The cycle has `cycleId`, name, startDate, endDate, status.

**Step 2 — Admin creates the FEEDBACK form for that cycle.**
Navigates to `AppraisalFormDesign` (currently typed for self/manager — see gap below). The page calls:
1. `POST /api/v1/appraisal-forms` → creates `AppraisalForm` with `formType = FEEDBACK` and `cycle_id`.
2. `POST /api/v1/appraisal-forms/{formId}/categories` → creates each `FormCategory` (Communication, Technical Skills, Teamwork, etc.).
3. `POST /api/v1/appraisal-forms/categories/{categoryId}/questions` → creates each `Question` under a category, with `questionType = RATING` and `isRequired = true`.

**Step 3 — Admin configures department feedback rules (optional).**
`POST /api/v1/dept-feedback-config` — sets min/max peers and subordinates per (department, jobLevel). Used by the generator to override default caps.

**Step 4 — Admin generates the 360° requests.**
Navigates to `/360-feedback/admin`, picks the cycle, sets `globalMaxLimit`, clicks **Generate**.
- Frontend: `useGenerateFeedbackRequestsMutation` → `POST /feedback/generate?cycleId=…`.
- Backend: `FeedbackRequestServiceImpl.process360Generation`:
  1. Loads all employees with `levelRank ∈ [4,7]` and active status (excludes L01–L03, L08, L09, RESIGNED).
  2. Loads `DepartmentFeedbackConfig` rows for fast lookup.
  3. Loads previous-cycle assignments (for the rotation rule — don't pick the same evaluator twice).
  4. Resolves a default FEEDBACK form for the cycle.
  5. For each target employee, calls `generateRequestsForEmployee`:
     - Creates a **SELF** request (target evaluates self).
     - Creates a **DIRECT_MANAGER** request (or **SUPERIOR** for L04 via `assignTopManagementEvaluator`).
     - Creates **PEER** requests (three passes: rotated non-reciprocal → rotated reciprocal → non-rotated fallback).
     - Creates **SUBORDINATE** requests (two passes: non-reciprocal → reciprocal fallback) where `maxSubs > 0`.
  6. Each successful `createRequest` persists a `FeedbackRequest` row (status PENDING, `isAnonymous` per builder default — Bug source 7) and publishes a `FEEDBACK_REQUESTED` notification to the evaluator.

**Step 5 — Evaluator sees their pending list.**
Logs in, navigates to `/360-feedback/pending`.
- Frontend: `useGetMyFeedbackRequestsQuery()` → `GET /feedback/my-requests`.
- Backend returns rows where `evaluator_id = me` and status = PENDING.

**Step 6 — Evaluator opens a request and loads the form.**
Clicks a row → `SubmissionModal` opens.
- Frontend: `useGetFormQuestionsQuery(requestId)` → `GET /360-feedback/feedbacks/request/{requestId}/questions`.
- Backend: `FeedbackFormServiceImpl.getQuestionsForRequest` reads `FeedbackRequest.form_id`, calls `AppraisalFormService.getFullForm` → returns categories + questions.

**Step 7 — Evaluator fills and submits.**
Star ratings 1–5 per question, optional per-question comment, overall comment.
- Frontend: `useSubmitFeedbackMutation` → `POST /feedback/submit` with `FeedbackSubmissionRequest { requestId, overallComment, responses: [{ questionId, score, comment }] }`.
- Backend: `FeedbackSubmissionServiceImpl.submitFeedback`:
  1. Loads the `FeedbackRequest`; rejects if already COMPLETED or evaluator mismatch.
  2. Builds a `Feedback` row + list of `FeedbackResponse` rows.
  3. Computes `averageScore = (totalPoints × 100) / (questionCount × 5)`.
  4. Saves both, flips request status to COMPLETED.
  5. Publishes a `FEEDBACK_SUBMITTED` notification to the target user.

Repeats for every evaluator (self, manager, peers, subordinates).

**Step 8 — Admin generates summaries.**
After all (or most) feedbacks are in, admin clicks **Generate All Summaries**.
- Frontend: `useGenerateAllSummariesMutation` → `POST /360-feedback/summary/generate-all?cycleId=…`.
- Backend: `FeedbackSummaryServiceImpl.generateAllSummaries(cycleId)` iterates every employee and calls `generateSummary(employeeId, cycleId)`:
  1. Loads all `Feedback` rows for that target+cycle.
  2. Groups by `relationship`.
  3. Averages each group → `managerScore`, `peerScore`, `subordinateScore`, `selfScore`.
  4. Computes `finalScore = 0.4·mgr + 0.3·peer + 0.2·sub + 0.1·self` (hardcoded; Bug 1).
  5. Upserts `FeedbackSummary`.

**Step 9 — Target views their report.**
Navigates to `/360-feedback/my-report`.
- Frontend: `useGetFeedbackSummaryQuery({ targetUserId, cycleId })` → `GET /feedback/summary/{userId}/{cycleId}`.
- Backend: `FeedbackReportServiceImpl.getFeedbackSummary` reads all feedbacks, splits self vs. others scores by category, builds anonymized comment list (currently hardcoded by relationship, Bug 3), returns:
  - `selfScores[]`, `managerScores[]`, `peerScores[]`, `subordinateScores[]`, aggregated `scores[]` (overall).
  - `detailedComments[]` with anonymous label for PEER/SUBORDINATE.
  - `totalAverageScore`, `isFinalized`.
- Frontend renders four `ScoreCard`s, a radar chart across categories, a bar chart, and the comments list.

**Step 10 — Admin finalizes.**
Admin reviews the summary, clicks **Finalize**.
- Frontend: `useFinalizeSummaryMutation` → `PUT /360-feedback/summary/{summaryId}/finalize`.
- Backend: `FeedbackSummaryServiceImpl.finalizeSummary` sets `isFinalized = true`. (No calibration capture today — manager summary and calibrated score don't exist as fields yet.)

That is the entire flow today, end to end.

---

## Part 3 — Gap Analysis Summary

### 3.1 Confirmed bugs (data-correctness)

1. `generateSummary` deflates `finalScore` when a relationship group has no feedback (weights × 0 still added to total).
2. `generateSummary` reads only `MANAGER` — silently drops `SUPERIOR`/`DIRECT_MANAGER` feedback.
3. `submitFeedback` NPE on null scores; divide-by-zero on empty `responses`.
4. `getFeedbackSummary` hardcodes anonymity by relationship; ignores `FeedbackRequest.isAnonymous`. No suppression threshold. Comments not shuffled.
5. `findSubordinatesByDepartment` filters `levelRank == target+1` — skip-level reports are invisible.
6. `FeedbackRequest.isAnonymous` defaults to `true` for every relationship — wrong for MANAGER/SELF.

### 3.2 Design gaps

7. Two parallel selection flows (`FeedbackSelectionService` vs. `FeedbackRequestService`) duplicate logic.
8. Single FEEDBACK form for all four relationships — can't ask subordinates "Does your manager give clear direction?" without showing it to peers too.
9. No `dueDate` / draft save / reminder scheduler.
10. No authorization checks on read endpoints.
11. No calibration / manager-summary capture.
12. No cycle freeze (post-finalization writes still possible).

### 3.3 Missing UI

13. **No 360°-specific entry to form creation.** The Admin page (`Feedback360AdminPage`) jumps straight to "Generate Requests" — the admin has to know to navigate separately to `/appraisal-forms/design?type=FEEDBACK`. There's no nudge, no validation that a FEEDBACK form exists before generation, and no four-form requirement (once Phase 2 ships).
14. No Scoring Policy editor (weights still in code).
15. No Calibrate modal in the summary list.
16. No Gap-Analysis tab on the report.
17. No competency CRUD page.

---

## Part 4 — Yes, You Need a Feedback-Form Create Page (Wired-Up Version)

The page itself **already exists** — `pages/appraisal/AppraisalFormDesign.tsx`. What's missing is the **360° wiring**. Three small additions turn it into the feedback-form create page you're picturing.

### 4.1 Add a "Create Feedback Form" button on the 360° Admin page

In `Feedback360AdminPage.tsx`, near the cycle picker, add:

```tsx
<button
  style={secondaryBtn}
  onClick={() => navigate(`/appraisal-forms/design?type=FEEDBACK&cycleId=${selectedCycleId}`)}
  disabled={!selectedCycleId}
>
  <Plus size={14} /> Create Feedback Form
</button>
```

Also list existing FEEDBACK forms for the selected cycle inline, with "Edit" buttons that go to `/appraisal-forms/design?type=FEEDBACK&cycleId=…&edit=true&formId=…`.

### 4.2 Add a FEEDBACK preset to `AppraisalFormDesign.tsx`

Today the page presets the title based on `MANAGER_EVALUATION` vs. `SELF_ASSESSMENT`. Add a third branch:

```tsx
const defaultTitle = (type: string) => {
  switch (type) {
    case 'MANAGER_EVALUATION': return 'Manager Evaluation Template';
    case 'SELF_ASSESSMENT':    return 'Self Assessment Template';
    case 'FEEDBACK':           return '360° Feedback Template';
  }
};
```

And a default-categories block for FEEDBACK, matching the ACE Data Systems paper form:

```tsx
const FEEDBACK_DEFAULT_CATEGORIES: CategoryDraft[] = [
  { name: 'Performance Evaluation', questions: [
    { text: 'Communication Skills',           type: 'RATING', isRequired: true },
    { text: 'Teamwork & Collaboration',       type: 'RATING', isRequired: true },
    { text: 'Technical Skills',               type: 'RATING', isRequired: true },
    { text: 'Work Quality',                   type: 'RATING', isRequired: true },
    { text: 'Accountability & Responsibility',type: 'RATING', isRequired: true },
    { text: 'Problem Solving',                type: 'RATING', isRequired: true },
    { text: 'Learning & Improvement',         type: 'RATING', isRequired: true },
    { text: 'Attitude & Professionalism',     type: 'RATING', isRequired: true },
  ]},
];
```

### 4.3 Add a Target-Relationship picker (after backend Phase 2 ships)

Once `AppraisalForm.targetRelationship` exists on the backend, surface it in the designer header:

```tsx
{formType === 'FEEDBACK' && (
  <div>
    <label style={labelStyle}>Target Relationship</label>
    <select
      style={inputStyle}
      value={targetRelationship}
      onChange={(e) => setTargetRelationship(e.target.value as FeedbackRelationship)}
    >
      <option value="DIRECT_MANAGER">Manager evaluates target</option>
      <option value="PEER">Peer evaluates target</option>
      <option value="SUBORDINATE">Subordinate evaluates target</option>
      <option value="SELF">Self-assessment</option>
    </select>
  </div>
)}
```

And block "Generate Requests" in `Feedback360AdminPage` until all four target-relationship forms exist for the cycle.

### 4.4 Optional — print view that matches the paper form

Add a `/360-feedback/print/:requestId` route that renders a fixed A4 layout (employee info header, evaluator info, criteria table with checkboxes, additional comments, score formula footer). Used by HR when paper records are needed.

---

## Part 5 — Implementation Plan to Bridge the Gaps

This consolidates the backend and frontend plans you already have, in execution order.

### Phase 1 — Correctness (1–2 days)

1. Apply the six bug fixes (Fixes 1–5 in `360_FEEDBACK_MODIFIED_IMPLEMENTATION_PLAN.md`).
2. Collapse `FeedbackRelationship` enum to 4 values; data migration script.
3. Add `IN_PROGRESS`, `CANCELLED` to `FeedbackStatus`; drop `SUBMITTED`.
4. Derive `FeedbackRequest.isAnonymous` from relationship.
5. Frontend: standardize `transformResponse` to `ApiResponse<T>`; add `selfVsOthersGap`, `participation` to `FeedbackSummaryResponse` type.

### Phase 2 — Form-creation wiring + relationship-per-form (2–3 days)

6. Backend: add `targetRelationship` column to `AppraisalForm`; update generator to resolve form by `(cycle, relationship)`.
7. Frontend: 4.1, 4.2, 4.3 above — link the existing designer from the 360° Admin page, add FEEDBACK preset, add target-relationship picker.
8. Frontend: in `Feedback360AdminPage`, render four form slots (Manager / Peer / Subordinate / Self) for the selected cycle, with "Create" links pre-filled with `?relationship=…`. Block Generate until all four slots are filled.
9. Add `dueDate` / `startedAt` / `lastReminderSentAt` to `FeedbackRequest`.

### Phase 3 — Scoring policy + calibration (2–3 days)

10. Backend: `Competency`, `ScoringPolicy` entities + repositories + cycle-default seeding.
11. Backend: `managerSummary`, `calibratedFinalScore`, `finalizedAt`, `finalizedBy` on `FeedbackSummary`; new `POST /360-feedback/summary/{id}/manager-review` endpoint.
12. Frontend: Scoring Policy editor panel on Admin page; Calibrate modal; Gap-Analysis tab on Report page; Manager Summary panel.

### Phase 4 — Operations (2 days)

13. Reminder scheduler (`@Scheduled`), draft save endpoint, IN_PROGRESS state in modal.
14. `FeedbackAccessGuard` on all read endpoints.
15. Cycle freeze (block writes when `isFinalized = true`).

### Phase 5 — Optional (1–2 days)

16. `EvaluatorNomination` workflow + UI.
17. Print view for paper records.

---

## Part 6 — Quick Decision Table for Your Question

| Question | Answer |
|---|---|
| Do I need a new feedback-form create page? | **No.** `AppraisalFormDesign.tsx` already exists. |
| Does it currently support 360° FEEDBACK forms? | **Partially.** Type is selectable; preset wording and relationship picker missing. |
| Is there a link to it from the 360° Admin page? | **No** — admin has to navigate manually. Add the button in 4.1. |
| Does each relationship get its own form? | **No, today.** Requires Phase 2 (`targetRelationship` column + form-slot UI). |
| Does the backend already accept the form on each request? | **Yes** — `FeedbackRequest.form` is set during generation and read in `FeedbackFormServiceImpl.getQuestionsForRequest`. |
| Is the 360° service flow correct end-to-end today? | **Mostly** — but Bugs 1 and 3 cause silent data loss in summaries and reports. Fix in Phase 1 before any production rollout. |
