# 360° Feedback — Remaining Work + Reports Plan

> Scope: a focused audit of what's already built, what's still missing, and which reports to surface in the UI versus generate as Jasper PDFs.
> Stack confirmed: Spring Boot + JasperReports (already in `pom.xml`); React + RTK Query frontend; 10 existing `.jrxml` templates including `feedback_participation_report.jrxml`.

---

## Part 1 — Current State Inventory

### 1.1 Backend (`epms_backend`) — already built

- Domain model: `FeedbackRequest`, `Feedback`, `FeedbackResponse`, `FeedbackSummary`, `DepartmentFeedbackConfig`.
- Generation: `FeedbackRequestServiceImpl.process360Generation` (peer rotation, 3-pass anti-collusion, manager/superior assignment, subordinate lookup).
- Submission: `FeedbackSubmissionServiceImpl.submitFeedback` (score calc, status flip, notification).
- Summary: `FeedbackSummaryServiceImpl.generateSummary` + `generateAllSummaries` (weighted score per relationship).
- Report (per-employee): `FeedbackReportServiceImpl.getFeedbackSummary` (radar/bar data + comments).
- Reassign / Cancel: `Feedback360Controller.{reassignRequest, cancelRequest}`.
- Form CRUD: `AppraisalFormController` + `QuestionController` + form designer.
- JasperReports: library wired, generic `ReportController` at `/api/v1/reports/*`, 10 `.jrxml` templates under `src/main/resources/reports/`.

### 1.2 Frontend (`epms_frontend`) — already built

- Pages: `Feedback360PendingPage` (evaluator), `Feedback360ReportPage` (target's report), `Feedback360AdminPage` (HR).
- Draft autosave, due-date display, overdue/cancelled badges, Reassign / Cancel actions, form-slot UI.
- RTK Query endpoints in `feedback360Api.ts` for all the flows above.
- Recharts radar/bar visualizations on the Report page.

### 1.3 Existing Jasper templates

```
appraisal_status_report.jrxml
audit_trail_report.jrxml
dept_performance_report.jrxml
employee_master_report.jrxml
feedback_participation_report.jrxml   ← already exists, can be reused
kpi_achievement_report.jrxml
performance_ranking_report.jrxml
performance_summary_report.jrxml
performance_trend_report.jrxml
pip_tracking_report.jrxml
```

`ReportController` already exposes `/api/v1/reports/feedback-participation` (JSON) and `/feedback-participation/download` (PDF). So one 360 report is partially done — it just needs the data path and the .jrxml template populated correctly.

---

## Part 2 — What's Still Missing (Gap List)

Grouped by impact.

### 2.1 Critical (must-ship for production correctness)

- **Bug 1** — `generateSummary` deflates `finalScore` when a relationship group is missing (multiplies zero into weighted average).
- **Bug 2** — `submitFeedback` NPE on null scores; divide-by-zero on empty responses; no `@Min/@Max` on score.
- **Bug 3** — `getFeedbackSummary` hardcodes anonymity by relationship; ignores `isAnonymous` flag; no suppression threshold; comments not shuffled.
- **Bug 4** — `findSubordinatesByDepartment` filters `levelRank == target+1` only — skip-level reports invisible.
- **Bug 5** — `FeedbackRequest.isAnonymous` defaults to `true` for all relationships, including MANAGER/SELF.
- **Bug 6** — `FeedbackRelationship` has 6 values (MANAGER/SUPERIOR/DIRECT_MANAGER), summary only reads MANAGER, dropping SUPERIOR feedback.
- **Bug 7** — Generator silently accepts cycles with no FEEDBACK form, producing requests with `form_id = null` → evaluator modal breaks. (Form-load fix plan.)
- **Bug 8** — Peer / subordinate lookups don't filter out `RESIGNED` or `LONG_TERM_LEAVE` evaluators, even though the target filter excludes them.

### 2.2 Important (Phase 2)

- `targetRelationship` on `AppraisalForm` — different forms per Manager/Peer/Subordinate/Self.
- `dueDate`, `startedAt`, `lastReminderSentAt` on `FeedbackRequest`; `IN_PROGRESS`, `CANCELLED` statuses.
- Reminder scheduler (T-7, T-2, T-0, overdue escalation).
- Draft save endpoint + resume flow (frontend already calls these — backend may need them if not implemented).
- `FeedbackAccessGuard` — authz on all read endpoints (currently any logged-in user can read any report).

### 2.3 Nice-to-have (Phase 3)

- `Competency` entity + FK on `Question` → per-competency aggregation across forms.
- `ScoringPolicy` (per cycle, optionally per job level) — remove hardcoded `0.4/0.3/0.2/0.1` weights.
- `managerSummary` + `calibratedFinalScore` on `FeedbackSummary` — calibration step.
- `EvaluatorNomination` workflow (self-propose peers → manager approve) — optional.
- Cycle freeze (block writes when `isFinalized = true`).

### 2.4 Frontend-only gaps

- Cycle locked banner.
- Manager view of direct-report summaries (`/360-feedback/team-reports/:empId` route).
- Scoring Policy editor (admin).
- Calibrate modal (admin).
- Gap Analysis tab on Report page (Self vs Others per competency).
- Competency CRUD page.
- Participation strip on Report (Manager 1/1 · Peers 4/5 · ...).
- Standardize `transformResponse` in `feedback360Api.ts` (mixed shapes today).

---

## Part 3 — In-App Reports (Show in UI, no PDF)

These are dashboards/widgets that update live and are best viewed inside the app, not exported.

### 3.1 Existing & to keep

- **Per-employee 360° Report** (`Feedback360ReportPage`) — score cards × 4 sources, radar chart, bar chart, comments. Already built. **Enhance** with: participation strip, calibrated score chip, manager summary panel, Gap Analysis tab.
- **Admin Generated Assignments table** (`Feedback360AdminPage`) — Target / Evaluator / Relationship / Status / Due Date / Flags / Actions. Already built. **Enhance** with: Reassign/Cancel after Generate (fix in progress), Preview mode banner.

### 3.2 To add (in-app, interactive)

- **HR Cycle Dashboard** — header KPIs for the active cycle:
  - Total targets / Submitted / Pending / Overdue / Cancelled
  - Per-relationship submission rate (Manager 90%, Peer 75%, Subordinate 60%, Self 95%)
  - Bottlenecks list: top 5 evaluators with most pending requests
  - Cycle freeze status
- **Manager Team Dashboard** — for any L4–L6 manager, list of direct reports with their submission progress and (post-cycle) their 360 final scores. Reuses `FeedbackSummaryResponse` filtered by `managerOf(currentUser)`.
- **Per-Competency Heatmap** — rows = competencies (Communication, Teamwork, …), columns = relationships, cells = average score. Across all targets in a department or cycle. Needs `Competency` entity (Phase 3 dep).
- **Self vs. Others Gap Tab** on per-employee report — already planned. Recharts bar with two bars per competency.
- **Calibration Workbench** (admin only) — table of summaries with raw score, calibrated score input, manager summary textarea, "Finalize" action. Needs `managerSummary` + `calibratedFinalScore` fields (Phase 3 dep).

---

## Part 4 — PDF Reports (Jasper, downloadable)

These are formal deliverables HR or the employee will save, email, or print. Use the existing Jasper infrastructure.

### 4.1 New Jasper reports to add

#### A. **Individual 360° Feedback Report** (highest priority)

The single most important deliverable. One PDF per employee per cycle. Used in performance reviews and personnel files.

**Sections:**
1. Cover page — employee info (name, ID, position, department), cycle name, assessment & effective dates, evaluator role distribution.
2. Headline scorecard — final score, manager/peer/subordinate/self scores, prior-cycle delta if available.
3. Per-relationship breakdown — score per category for each relationship, presented as a small table.
4. Radar chart — 4 polygons (one per relationship) overlaid. JasperReports has a chart component; or render a Recharts SVG server-side and embed.
5. Self vs Others gap — bar chart of `|self − others|` per competency, with the biggest gaps flagged.
6. Comments — grouped by relationship, peer/subordinate names hidden, shuffled order.
7. Manager summary + calibration note (if present).
8. Footer — generated date, cycle freeze status, formula reference: `Score = (Total Points × 100) / (Questions × 5)`.

**Backend:**
- New `.jrxml` file: `src/main/resources/reports/feedback_360_individual_report.jrxml`.
- Endpoint: `GET /api/v1/reports/feedback-360/{targetUserId}/{cycleId}/download` → `application/pdf` byte[].
- Service: `ReportServiceImpl.generateIndividual360Report(targetUserId, cycleId, format)`.

**Frontend:**
- "Download PDF" button on `Feedback360ReportPage`.
- For managers: "Download My Team's Reports (zip)" — server returns zip of PDFs for their direct reports.

#### B. **Cycle Summary Report** (HR roll-up)

One PDF per cycle, aggregating across all targets.

**Sections:**
1. Cycle metadata + participation stats.
2. Distribution of final scores (histogram or quartile band: top 10% / middle 80% / bottom 10%).
3. Department comparison — average final score per department, ranked.
4. Per-competency org-wide averages.
5. Top strengths and development areas across the org.
6. Outlier list — employees with `|self − others| ≥ 1.0` (development opportunities).

**Backend:**
- `.jrxml`: `feedback_360_cycle_summary.jrxml`.
- Endpoint: `GET /api/v1/reports/feedback-360/cycle/{cycleId}/download`.

#### C. **Manager Review Pack** (per manager)

One PDF for a manager covering all of their direct reports' 360 outcomes — used during their calibration session.

**Sections per direct report:**
1. Mini headline scorecard (final + 4 source scores).
2. Top 3 strengths / Top 3 development areas (per the report's question rankings).
3. Self vs Others gap summary.
4. Notable peer/subordinate comments (anonymized).

**Backend:**
- `.jrxml`: `feedback_360_manager_pack.jrxml`.
- Endpoint: `GET /api/v1/reports/feedback-360/manager/{managerId}/cycle/{cycleId}/download`.

#### D. **Participation / Audit Report** (HR compliance)

Already partly there — `feedback_participation_report.jrxml`. Extend with:
- Per-evaluator response time (median days from request to submission).
- Reciprocal-fallback flag count per cycle.
- Reassign/cancel audit trail.
- Suppression-triggered rows (group below threshold of 3).

**Backend:** reuse the existing endpoint, extend the DTO.

#### E. **Print Form** (paper-style 360 form)

For organizations that still want to collect feedback on paper, generate a print-ready evaluator form matching the ACE Data Systems paper template (employee header, evaluator info, 8 criteria with checkboxes 1–5 + comments column, additional comments, score footer).

**Backend:**
- `.jrxml`: `feedback_360_paper_form.jrxml`.
- Endpoint: `GET /api/v1/reports/feedback-360/print-form/{requestId}/download`.
- Pre-fills target + evaluator + cycle dates from the `FeedbackRequest`.

### 4.2 Existing reports to extend (don't rebuild)

- **`feedback_participation_report.jrxml`** — already populated. Verify the data source query covers the post-Phase-1 schema (4-value `FeedbackRelationship`, new `CANCELLED` status).
- **`appraisal_status_report.jrxml`** — add a "360° feedback completion %" column.
- **`dept_performance_report.jrxml`** — when 360 summaries exist for a cycle, blend the 360 final score into the department average.

---

## Part 5 — Rollout Order

Pair each report with its data prerequisites.

### Step 1 — Ship the correctness fixes first (~2 days)

Without these, every report shows wrong numbers. Apply Bugs 1–8 from §2.1, including the form-load guard from the previous plan.

### Step 2 — Individual 360° Report PDF (~2 days)

Single highest-value deliverable. Most of the data already comes out of `FeedbackReportServiceImpl.getFeedbackSummary` — wrap it in a Jasper fill-and-export.

Steps:
1. Create `feedback_360_individual_report.jrxml` based on `performance_summary_report.jrxml` as a template.
2. Add `ReportServiceImpl.generateIndividual360Report(...)`.
3. Add controller endpoint at `/api/v1/reports/feedback-360/{userId}/{cycleId}/download`.
4. Add "Download PDF" button on `Feedback360ReportPage`.

### Step 3 — In-app HR Cycle Dashboard (~1 day)

No new schema, just a new aggregation endpoint:
`GET /api/v1/feedback/cycle/{cycleId}/dashboard` → submission stats + bottlenecks.
Plus a new admin page section. Useful immediately for HR to see who's behind.

### Step 4 — Cycle Summary Report PDF (~1 day)

Build on Step 2's data path. New `.jrxml` + endpoint.

### Step 5 — Phase 2 schema (Competency, ScoringPolicy, calibration) (~2 days)

Adds the data for the Gap Analysis tab, heatmaps, and calibration in the Manager Pack.

### Step 6 — Manager Review Pack PDF + Calibration Workbench UI (~2 days)

Depends on Step 5. Manager opens their team, sees calibration UI, clicks "Download Pack" → PDF lands.

### Step 7 — Paper Form PDF + Print View (~½ day)

For org compliance / paper records.

### Step 8 — Extend existing reports (~½ day)

Touch the three existing `.jrxml` files in §4.2.

**Total: ~10 days of focused work.** Steps 1–4 are the must-haves; Steps 5–8 can ship incrementally.

---

## Part 6 — Decision Summary (Show in UI vs Generate PDF)

| Report | UI | Jasper PDF | Why |
|---|---|---|---|
| Per-employee 360 Report | ✓ (interactive) | ✓ (formal record) | Employee reads in-app, HR archives the PDF |
| HR Cycle Dashboard | ✓ | — | Real-time progress, no value in static PDF |
| Manager Team Dashboard | ✓ | — | Same reason |
| Per-Competency Heatmap | ✓ | ✓ (as appendix) | Interactive in-app, PDF inside Cycle Summary |
| Self vs Others Gap | ✓ (tab) | ✓ (inside Individual report) | Both |
| Calibration Workbench | ✓ | — | Workflow tool, not a deliverable |
| Cycle Summary | — | ✓ | HR shares with leadership, archived |
| Manager Review Pack | — | ✓ | Manager prints / brings to calibration meetings |
| Participation Report | — | ✓ (already exists) | Compliance / audit |
| Paper Print Form | — | ✓ | Used when collecting paper feedback |
| Audit Trail | ✓ (admin table) | ✓ (already exists) | HR review + formal archive |

---

## Part 7 — Quick Reference for Implementing a New Jasper Report

For each new report:

1. **Template** — copy the closest existing `.jrxml` (e.g., `performance_summary_report.jrxml`) and adjust field bindings.
2. **DTO** — create or reuse a `…ReportDTO` in `dto/report/`. Match field names exactly to `.jrxml` text-field expressions.
3. **Service method** in `ReportServiceImpl`:
   ```java
   public byte[] generate360IndividualPdf(Long userId, Long cycleId) {
       Map<String, Object> params = ...;
       JRBeanCollectionDataSource ds = new JRBeanCollectionDataSource(rows);
       JasperReport jr = JasperCompileManager.compileReport(
           getClass().getResourceAsStream("/reports/feedback_360_individual_report.jrxml"));
       JasperPrint print = JasperFillManager.fillReport(jr, params, ds);
       return JasperExportManager.exportReportToPdf(print);
   }
   ```
4. **Controller** in `ReportController`:
   ```java
   @GetMapping("/feedback-360/{userId}/{cycleId}/download")
   public ResponseEntity<byte[]> download360(...) {
       byte[] pdf = reportService.generate360IndividualPdf(userId, cycleId);
       return ResponseEntity.ok()
               .contentType(MediaType.APPLICATION_PDF)
               .header("Content-Disposition", "attachment; filename=...")
               .body(pdf);
   }
   ```
5. **Frontend** — add a `useGenerate360PdfMutation` (or a plain `fetch` that triggers a download) and a "Download PDF" button.

Use the existing `downloadKpiAchievementReport` flow in `ReportController` as the reference shape — it already handles the byte[] + content-disposition correctly.
