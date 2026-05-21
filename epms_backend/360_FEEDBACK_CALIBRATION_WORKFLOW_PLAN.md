# 360° Feedback — Calibration Workflow Implementation Plan

> Scope: turn `calibratedFinalScore` from an inert field into a real HR fairness-review workflow that adjusts the official performance rating after raw scores are collected.

---

## 0. Concept Recap

Three layers of score in EPMS, in order:

| Layer | Field | Source | Authority |
|---|---|---|---|
| Raw component scores | `peerScore`, `managerScore`, `subordinateScore`, `selfScore` | Submitted feedback | System |
| System final | `finalScore` on `FeedbackSummary` | Weighted average by `ScoringPolicy` | System |
| Calibrated final | `calibratedFinalScore` on `FeedbackSummary` | HR / calibration committee adjustment | Human |

Calibration is **optional per cycle**. When no calibration runs, `calibratedFinalScore` stays null and the system's `finalScore` is the official rating. When calibration runs, `calibratedFinalScore` is the official rating and `finalScore` is preserved as the audit baseline.

---

## 1. Schema Changes

### 1.1 Add fields to `FeedbackSummary`

(Some of these are already proposed in the modified plan — listed here together for completeness.)

```java
// FeedbackSummary.java
@Column(columnDefinition = "TEXT")
private String managerSummary;           // free-text from manager during calibration

private BigDecimal calibratedFinalScore; // HR-adjusted official score (nullable)

@Enumerated(EnumType.STRING)
private CalibrationStatus calibrationStatus;  // see new enum below

@Column(columnDefinition = "TEXT")
private String calibrationReason;        // why was the score adjusted

private Instant calibrationDate;         // when adjustment was saved
private Long calibratedBy;               // employee_id of HR/committee member

private Instant finalizedAt;
private Long finalizedBy;
```

### 1.2 New enum `CalibrationStatus`

```java
public enum CalibrationStatus {
    NOT_STARTED,      // default — system finalScore is canonical
    UNDER_REVIEW,     // a calibration session has flagged this for review
    ADJUSTED,         // HR set a calibratedFinalScore
    APPROVED,         // committee approved the adjustment (or no adjustment needed)
    LOCKED            // cycle finalized — no further edits
}
```

### 1.3 New entity `CalibrationSession`

Groups summaries reviewed together (a department's worth of employees, a cycle-wide pass, etc.). Useful for audit and bell-curve enforcement.

```java
@Entity
@Table(name = "calibration_session")
public class CalibrationSession extends BaseEntity {
    @Id @GeneratedValue Long id;

    @ManyToOne AppraisalCycle cycle;
    @ManyToOne Department department;      // nullable — null = cycle-wide

    private String name;                   // e.g., "Q1 2026 — Engineering"
    private String facilitator;            // employee name
    private Instant scheduledAt;
    private Instant completedAt;

    @Enumerated(EnumType.STRING)
    private CalibrationSessionStatus status; // PLANNED, IN_PROGRESS, COMPLETED

    @Column(columnDefinition = "TEXT")
    private String notes;
}
```

### 1.4 Junction table `CalibrationSessionSummary`

Many-to-many between sessions and summaries (one summary can be reviewed in multiple sessions across the cycle):

```java
@Entity
@Table(name = "calibration_session_summary",
    uniqueConstraints = @UniqueConstraint(columnNames = {"session_id", "summary_id"}))
public class CalibrationSessionSummary extends BaseEntity {
    @Id @GeneratedValue Long id;
    @ManyToOne CalibrationSession session;
    @ManyToOne FeedbackSummary summary;
    private BigDecimal scoreBeforeAdjustment;  // snapshot — what finalScore was when added to session
    private BigDecimal scoreAfterAdjustment;   // snapshot — what calibratedFinalScore was set to
}
```

This snapshot pattern preserves the audit trail even if `FeedbackSummary` is recomputed later.

---

## 2. State Machine

```
NOT_STARTED ──────┐
                  │ (HR flags summary for review)
                  ▼
            UNDER_REVIEW ─────────────┐
                  │                   │ (committee decides "no change needed")
                  │ (HR sets a        │
                  │  calibrated       │
                  │  score)           │
                  ▼                   │
              ADJUSTED ───────────────┤
                  │                   │
                  │ (committee        │
                  │  approves)        │
                  ▼                   │
              APPROVED ◄──────────────┘
                  │
                  │ (cycle finalized)
                  ▼
               LOCKED
```

Allowed transitions:
- `NOT_STARTED → UNDER_REVIEW` (HR flag)
- `UNDER_REVIEW → ADJUSTED` (HR sets score)
- `UNDER_REVIEW → APPROVED` (no change needed)
- `ADJUSTED → APPROVED` (committee sign-off)
- `ADJUSTED → UNDER_REVIEW` (revert / re-discuss)
- `APPROVED → LOCKED` (cycle freeze)
- `NOT_STARTED → LOCKED` (auto on cycle freeze if never touched)

Anything in `LOCKED` is immutable except via an admin override (logged).

---

## 3. Backend Services

### 3.1 New service `CalibrationService`

```java
public interface CalibrationService {
    // Session lifecycle
    Long createSession(CreateSessionRequest req);
    void addSummariesToSession(Long sessionId, List<Long> summaryIds);
    void startSession(Long sessionId);
    void completeSession(Long sessionId);

    // Per-summary actions
    void flagForReview(Long summaryId);                                    // NOT_STARTED → UNDER_REVIEW
    void adjustScore(Long summaryId, AdjustScoreRequest req);              // UNDER_REVIEW → ADJUSTED
    void approve(Long summaryId, String approverComment);                  // → APPROVED
    void revert(Long summaryId);                                           // ADJUSTED → UNDER_REVIEW

    // Reports
    List<CalibrationDeltaRow> getCalibrationDeltas(Long cycleId);          // before/after table
    DistributionStats getScoreDistribution(Long cycleId, boolean calibrated);
}
```

### 3.2 New endpoints (Feedback360Controller or new CalibrationController)

```
POST   /api/v1/calibration/sessions
POST   /api/v1/calibration/sessions/{sessionId}/summaries
POST   /api/v1/calibration/sessions/{sessionId}/start
POST   /api/v1/calibration/sessions/{sessionId}/complete

POST   /api/v1/calibration/summaries/{summaryId}/flag
PUT    /api/v1/calibration/summaries/{summaryId}/adjust
POST   /api/v1/calibration/summaries/{summaryId}/approve
POST   /api/v1/calibration/summaries/{summaryId}/revert

GET    /api/v1/calibration/cycle/{cycleId}/deltas
GET    /api/v1/calibration/cycle/{cycleId}/distribution
```

All endpoints `@PreAuthorize("hasAnyRole('HR','ADMIN')")`. Approve endpoint additionally gated to a "committee member" sub-role if you want two-person sign-off.

### 3.3 Integration with `AppraisalCalculationServiceImpl`

Currently `getFeedbackTotalScore` reads `feedback_summary.final_score`. Update it to prefer the calibrated value when present:

```java
// PerformanceScoreServiceImpl
public BigDecimal getFeedbackTotalScore(Long employeeId, Long cycleId, Long appraisalId) {
    return feedbackSummaryRepo.findByEmployeeIdAndCycleCycleId(employeeId, cycleId)
            .map(fs -> fs.getCalibratedFinalScore() != null
                       ? fs.getCalibratedFinalScore()
                       : fs.getFinalScore())
            .orElse(BigDecimal.ZERO);
}
```

This is the single line that connects the calibration workflow to the appraisal `ResultPage`. After calibration, the calibrated value flows downstream automatically.

### 3.4 Cycle freeze

When admin clicks "Finalize Cycle":

```java
public void finalizeCycle(Long cycleId) {
    List<FeedbackSummary> summaries = summaryRepository.findByCycleCycleId(cycleId);
    Instant now = Instant.now();
    Long actor = currentUserId();
    for (FeedbackSummary s : summaries) {
        if (s.getCalibrationStatus() == null
            || s.getCalibrationStatus() == CalibrationStatus.NOT_STARTED) {
            s.setCalibrationStatus(CalibrationStatus.LOCKED);
        } else if (s.getCalibrationStatus() == CalibrationStatus.APPROVED) {
            s.setCalibrationStatus(CalibrationStatus.LOCKED);
        } else {
            throw new ValidationException(
                "Cannot lock cycle: summary " + s.getId() + " is in "
              + s.getCalibrationStatus() + ". Approve or revert it first.");
        }
        s.setIsFinalized(true);
        s.setFinalizedAt(now);
        s.setFinalizedBy(actor);
    }
    summaryRepository.saveAll(summaries);
}
```

Blocks cycle freeze when calibration is mid-flight — forces HR to resolve every flagged summary before locking.

---

## 4. Frontend UI

### 4.1 New page: Calibration Workbench (admin)

Route: `/360-feedback/admin/calibration?cycleId=…`

Layout:

- **Top stats**: counts per status (NOT_STARTED / UNDER_REVIEW / ADJUSTED / APPROVED / LOCKED), distribution histogram of raw vs. calibrated scores.
- **Filter bar**: department, status, score range, flagged-only.
- **Table**: rows = `FeedbackSummary`. Columns:
  - Employee
  - Department
  - Raw final score
  - Calibrated score (editable inline when status allows)
  - Delta
  - Status badge
  - Actions (Flag / Adjust / Approve / Revert)
- **Side panel** (opens on row click): full 360 report preview + manager summary + free-text reason input.

### 4.2 Inline edit pattern

```tsx
<input
  type="number" step="0.1" min="0" max="100"
  value={editingScore[row.id] ?? row.calibratedFinalScore ?? row.finalScore}
  onChange={(e) => setEditingScore({ ...editingScore, [row.id]: e.target.value })}
  onBlur={() => saveAdjustment(row.id)}
  disabled={row.calibrationStatus === 'LOCKED'}
/>
```

Adjustment endpoint receives `{ calibratedFinalScore, calibrationReason }`. UI requires non-empty reason before save — prevents silent edits.

### 4.3 Calibration session creation

Modal form:
- Session name (auto-suggest: "Q1 2026 — &lt;dept&gt;")
- Department (or "Cycle-wide")
- Facilitator
- Scheduled date
- Click "Add Summaries" → multi-select list of `FeedbackSummary` rows filtered by department and status

### 4.4 Distribution chart

Recharts histogram showing two overlays — `finalScore` (raw) and `calibratedFinalScore` (after adjustment). Helps HR see whether they've over-corrected or under-corrected. Buckets: 0–60, 60–70, 70–80, 80–90, 90–100.

### 4.5 Audit trail row

For each summary, expand a row to show:
- When it was flagged, by whom
- Each score adjustment (before → after, reason)
- Approval timestamp
- Lock timestamp
- Linked sessions

Implementation: backend keeps an `AuditTrail` table or uses Hibernate Envers on `FeedbackSummary`.

---

## 5. RTK Query Endpoints (Frontend)

Add to `feedback360Api.ts` (or a new `calibrationApi.ts`):

```typescript
createCalibrationSession: builder.mutation<{ sessionId: number }, CreateSessionRequest>({
  query: (body) => ({ url: '/calibration/sessions', method: 'POST', body }),
  invalidatesTags: ['CalibrationSession'],
}),

addSummariesToSession: builder.mutation<void, { sessionId: number; summaryIds: number[] }>({
  query: ({ sessionId, summaryIds }) => ({
    url: `/calibration/sessions/${sessionId}/summaries`,
    method: 'POST',
    body: { summaryIds },
  }),
  invalidatesTags: ['Feedback360Summary', 'CalibrationSession'],
}),

adjustSummaryScore: builder.mutation<void, { summaryId: number; calibratedFinalScore: number; calibrationReason: string }>({
  query: ({ summaryId, ...body }) => ({
    url: `/calibration/summaries/${summaryId}/adjust`,
    method: 'PUT',
    body,
  }),
  invalidatesTags: ['Feedback360Summary', 'Appraisal' as any],
}),

approveSummary: builder.mutation<void, { summaryId: number; approverComment?: string }>({
  query: ({ summaryId, ...body }) => ({
    url: `/calibration/summaries/${summaryId}/approve`,
    method: 'POST',
    body,
  }),
  invalidatesTags: ['Feedback360Summary'],
}),

getCycleDeltas: builder.query<CalibrationDeltaRow[], number>({
  query: (cycleId) => `/calibration/cycle/${cycleId}/deltas`,
  transformResponse: (res: ApiResponse<CalibrationDeltaRow[]>) => res.data,
  providesTags: ['CalibrationSession'],
}),
```

Adding `Appraisal` to the adjust mutation's `invalidatesTags` ensures the appraisal `ResultPage` refetches its score breakdown when calibration is saved.

Add tag types `CalibrationSession` and `Calibration` to `services/api.ts`.

---

## 6. Rollout Order

### Phase 1 — Field-only (1 day)

1. Add `calibratedFinalScore`, `calibrationStatus`, `managerSummary`, `calibrationReason`, `calibrationDate`, `calibratedBy`, `finalizedAt`, `finalizedBy` to `FeedbackSummary`.
2. Update `PerformanceScoreServiceImpl.getFeedbackTotalScore` to prefer calibrated value.
3. Done. Existing summaries continue working; nothing reads or writes the new fields yet.

### Phase 2 — Manual adjust endpoint (1 day)

4. `PUT /api/v1/calibration/summaries/{summaryId}/adjust` endpoint.
5. Frontend: in the existing summary list on `Feedback360AdminPage`, add an inline "Calibrate" action that opens a small modal with score input + reason. Save calls the endpoint; downstream `ResultPage` reflects the change.

This phase already delivers 80% of the business value with minimal UI.

### Phase 3 — Full state machine + workbench (2 days)

6. Add `CalibrationStatus` enum, transitions, flag/approve/revert endpoints.
7. Add `CalibrationSession` + junction table.
8. Build the Calibration Workbench page with table, side panel, audit trail.

### Phase 4 — Distribution + reporting (1 day)

9. Distribution chart + before/after deltas.
10. New Jasper report `feedback_360_calibration_deltas.jrxml` for HR archive.
11. Cycle freeze guard.

**Total: ~5 days end to end. Phase 1+2 alone is ~2 days and unlocks the workflow for HR.**

---

## 7. Files Touched (summary)

**Backend modified:**
- `model/feedback360/FeedbackSummary.java` — new fields
- `service/impl/PerformanceScoreServiceImpl.java` — prefer calibrated value
- `service/feedback360/impl/FeedbackSummaryServiceImpl.java` — finalize cycle guard

**Backend new:**
- `enums/CalibrationStatus.java`, `enums/CalibrationSessionStatus.java`
- `model/calibration/CalibrationSession.java`, `CalibrationSessionSummary.java`
- `service/calibration/CalibrationService.java` + impl
- `controller/calibration/CalibrationController.java`
- `dto/calibration/AdjustScoreRequest.java`, `CreateSessionRequest.java`, `CalibrationDeltaRow.java`, `DistributionStats.java`
- `repository/calibration/CalibrationSessionRepository.java`, `CalibrationSessionSummaryRepository.java`
- `db/migration/Vxxx__add_calibration_fields.sql`
- `src/main/resources/reports/feedback_360_calibration_deltas.jrxml`

**Frontend modified:**
- `features/feedback360/feedback360Api.ts` — adjust/approve/list endpoints
- `pages/feedback360/Feedback360AdminPage.tsx` — inline Calibrate action (Phase 2)
- `services/api.ts` — new tag types
- `pages/appraisal/ResultPage.tsx` — show "Calibrated by HR" chip when `calibratedFinalScore` present

**Frontend new:**
- `pages/feedback360/Feedback360CalibrationPage.tsx` — the workbench (Phase 3)
- `features/calibration/calibrationApi.ts` — optional split-out
- `components/feedback360/CalibrationStatusBadge.tsx`
- `components/feedback360/AdjustScoreModal.tsx`
- `components/feedback360/CalibrationDistributionChart.tsx`
- `components/feedback360/AuditTrailDrawer.tsx`

---

## 8. Test Plan

### Phase 1+2 unit:
- `getFeedbackTotalScore` returns `calibratedFinalScore` when present, else `finalScore`.
- `adjustScore` rejects when summary status is LOCKED.
- `adjustScore` requires non-empty `calibrationReason`.
- After adjust, `Appraisal.ResultPage` (via RTK cache invalidation) shows the new feedback row weighted score.

### Phase 3 e2e:
- Create session for Department X → add 5 summaries → start → flag two → adjust one → approve all → complete session.
- Verify state transitions and that LOCKED summaries can't be edited.
- Verify two-person approval (if you enable committee role).
- Verify audit trail captures every transition.

### Phase 4 distribution:
- Histogram of raw vs calibrated shows two overlapping series.
- Deltas table CSV download has correct columns.
- Cycle freeze blocks when any summary is UNDER_REVIEW or ADJUSTED.

---

## 9. Defaults & Policy Suggestions

- **Don't auto-calibrate.** Calibration is a human activity. Don't bell-curve scores algorithmically without HR opt-in.
- **Reason is mandatory.** Every adjustment must record a `calibrationReason`. Helps in employee disputes.
- **Two-person rule for large adjustments.** Optional: require committee sign-off when `|calibrated − raw| > 5` points.
- **Calibration only after all feedback submitted.** Block flagging until `feedback_summary.totalEvaluators` reaches the expected count from `DepartmentFeedbackConfig`.
- **Lock the raw `finalScore`** — never overwrite it; calibration is additive.

---

## 10. Connection to the Existing Plan

This plan is the **Phase 3 deliverable** referenced in `360_FEEDBACK_MODIFIED_IMPLEMENTATION_PLAN.md` ("calibration / manager-summary capture"). It depends on:

- `FeedbackSummary` schema additions (already proposed in the modified plan)
- The bug fixes from Phase 1 (otherwise raw `finalScore` is wrong and calibration starts from broken data)
- `ScoringPolicy` if you want per-level calibration weight overrides (optional)

Ship Phase 1 + 2 of this calibration plan immediately after the Phase 1 correctness fixes — it's the highest-business-value addition for HR and the smallest schema delta.
