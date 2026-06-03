# KPI Frontend Flow - Current Pages and Components

## Overview

The KPI frontend is a React/RTK Query module for KPI library setup, goal assignment, progress tracking, goal history, and score calculation. It is role-aware through `useAuth`, `Can`, and the active cycle context.

Primary data API: `src/services/kpiApi.ts`

Primary routes: `src/routes/kpiRoutes.tsx`

---

## Route Map

| Route | Component | Main audience |
|---|---|---|
| `/kpi` | `KpiHub` | All roles |
| `/kpi/my` | `MyKpiDashboard` | Employee |
| `/kpi/team` | `TeamKpiDashboard` | Manager, HR/Admin |
| `/kpi/library` | `KpiLibraryDashboard` | HR/Admin |
| `/kpi/library/new` | `KpiLibraryEntry` | HR/Admin |
| `/kpi/library/edit/:id` | `KpiLibraryEntry` | HR/Admin |
| `/kpi/manage` | `GoalManagement` | Manager, HR/Admin |
| `/kpi/assign/:employeeId` | `GoalAssignmentWorkspace` | Manager, HR/Admin |
| `/kpi/goals/:employeeId` | `GoalDetail` | Manager, HR/Admin, owner where allowed |
| `/kpi/history/:employeeId` | `EmployeeKpiHistory` | Self, HR/Admin, direct manager |
| `/admin/kpi/categories` | `KpiCategoryManager` | Admin/HR by permissions; delete is admin-only in backend |

`GoalDetail` and `GoalAssignmentWorkspace` accept `?cycleId=`.
`GoalDetail` opens assignment editing with `?mode=edit`, which lets the assignment workspace treat an approved historical-cycle view as editable after revert.

---

## Pages

### `KpiHub.tsx`

Route: `/kpi`

Landing page for the KPI module.

Key behavior:

- Fetches active libraries and the logged-in user's goal set for `activeCycleId`.
- Shows personal weighted progress based on non-draft goal items.
- Shows active library count for HR/Admin or assigned KPI count for employees.
- Shows goal-set status or "No Active Goals".
- Lists up to three active goal items and links to `/kpi/my`.
- HR/Admin see quick actions to `/kpi/manage` and `/kpi/library/new`.

API hooks:

- `useGetAllLibrariesQuery`
- `useGetGoalSetByEmployeeQuery`

---

### `KpiLibraryDashboard.tsx`

Route: `/kpi/library`

Library browsing page for KPI templates.

Current behavior:

- Uses `useGetAllLibrariesWithInactiveQuery`, so active and inactive libraries are visible.
- Filters by position, status, and keyword.
- Supports grid/list view toggle.
- Paginates six libraries per page.
- Cards/rows show position, active state, title, and KPI count.
- Current direct card actions are Edit and History. Clone/delete/toggle are not exposed directly on this page.
- Import button opens `KpiImportModal`.
- History button opens `KpiLibraryHistoryModal`, where activate/deactivate/delete actions are available per library version.

API hooks:

- `useGetAllLibrariesWithInactiveQuery`
- `useGetPositionsQuery`
- Modal hooks: import, history, toggle history status, delete library

---

### `KpiLibraryEntry.tsx`

Routes:

- `/kpi/library/new`
- `/kpi/library/edit/:id`

Create/edit form for a library template.

Main pieces:

- `LibraryBasicInfo`: title, target position, description.
- `LibrarySyncInfo`: weight validation hints.
- `LibraryKpiTable`: editable KPI item table.
- Save validates total weight and item caps before calling create/update.

API hooks:

- `useCreateLibraryMutation`
- `useUpdateLibraryMutation`
- `useGetLibraryByIdQuery`
- `useGetAllPositionsQuery`
- `useGetKpiCategoriesQuery`

---

### `GoalManagement.tsx`

Route: `/kpi/manage`

Organization-wide assignment and tracking page.

Current behavior:

- Resolves selected cycle from query string or active cycle.
- Fetches employees plus goal sets for either department-wide HR/Admin view or manager team view.
- Filters by keyword, department, position, and cycle.
- Historical/non-active cycle mode disables assignment controls.
- Selected employees can be passed into `BulkAssignModal`.
- Row navigation:
  - Existing approved/locked/scored-like view states go to `/kpi/goals/:employeeId?cycleId=...`.
  - Draft/not assigned paths go to `/kpi/assign/:employeeId?cycleId=...`.

API hooks:

- Employee, department, position, and cycle queries from their feature APIs.
- `useGetDepartmentGoalSetsQuery`
- `useGetTeamGoalSetsQuery`
- `useGetMidcycleSummaryQuery` (for selected employee/cycle midpoint insights)

---

### `GoalAssignmentWorkspace.tsx`

Route: `/kpi/assign/:employeeId`

Workspace for creating or editing one employee's goal set.

Cycle behavior:

- `resolvedCycleId` comes from `?cycleId=` or `activeCycleId`.
- Archived cycles are read-only.
- Non-active cycles are historical/read-only unless `mode=edit` is present.
- If no cycle can be resolved, a guard card is shown.
- Stale cached goal sets for a different cycle are ignored.

Header behavior:

- Shows employee, position, cycle, status, and View History.
- DRAFT or no goal set: Save Draft and Approve Goal Set.
- APPROVED: Edit Goals opens a confirmation and then calls revert-to-draft.
- LOCKED/ARCHIVED/read-only states: no edit buttons.

Template sidebar:

- Hidden in historical mode.
- Uses a segmented assignment mode:
  - Append: adds template items to current draft without overwriting.
  - Replace: archives existing draft goals and creates a new set.
- Replace with an existing goal set opens a confirmation modal.
- Template search filters active libraries.
- Add Custom Goal creates a local temp row.

Goal table:

- Inline editable while draft/editable.
- Disabled for archived, locked, archived-status, and approved states unless `mode=edit`.
- Columns include title, category, target, unit, weight, and delete.
- Weight values over 35% show warnings.
- Temp rows are local until Save Draft.
- Persisted row deletion calls the API and can fail if progress records exist.

Save Draft flow:

1. If no goal set exists, create a blank draft assignment.
2. Create each temp item with `addGoalItem`.
3. Bulk-update all persisted items with cleaned values.
4. Refetch and clear modified state.

API hooks:

- `useGetGoalSetByEmployeeQuery`
- `useGetAllLibrariesQuery`
- `useGetKpiCategoriesQuery`
- `useGetEmployeeByIdQuery`
- `useGetCyclesQuery`
- `useAssignKpiToEmployeeMutation`
- `useAddGoalItemMutation`
- `useDeleteGoalItemMutation`
- `useBulkUpdateGoalItemsMutation`
- `useApproveGoalSetMutation`
- `useRevertGoalSetMutation`

---

### `GoalDetail.tsx`

Route: `/kpi/goals/:employeeId`

Detail page for one employee/cycle goal set.

Current behavior:

- Fetches the goal set by employee + effective cycle.
- Fetches final score whenever a goal set exists, not only when locked.
- Treats `isScoredState` as `!!finalScore`.
- Uses active cycle fallback when no `?cycleId=` is supplied.
- Archived cycles or archived goal sets are read-only.
- History button opens `KpiAuditLogModal`.
- Modify Goals navigates to `/kpi/assign/:employeeId?cycleId=...&mode=edit`.
- Draft goals can be approved.
- Approved goals can be reverted or locked.
- Displays a midcycle phase timeline when midcycle data exists for the employee/cycle.
- Opens `MidcycleChangeModal` for managers/HR/Admin to trigger a midcycle split.
- Score sidebar allows Calculate Score or Recalculate Score for privileged users when cycle is not archived.

Item table behavior:

- Compliance rows use a highlighted background and shield icon.
- Owner can update non-compliance items only when goals are approved and not read-only.
- Compliance items show "MANAGER ONLY" to employees.
- Privileged users can verify compliance items when approved and not archived.
- Privileged users can revise items when not read-only and status is not locked.

Modals:

- `ProgressUpdateModal`
- `KpiRevisionModal`
- `KpiAuditLogModal`
- Custom revert confirmation
- Custom lock confirmation

API hooks:

- `useGetGoalSetByEmployeeQuery`
- `useGetFinalScoreQuery`
- `useGetMidcycleSummaryQuery`
- `useApproveGoalSetMutation`
- `useRevertGoalSetMutation`
- `useLockGoalSetMutation`
- `useCalculateScoresMutation`
- `useGetCyclesQuery`

---

### `MyKpiDashboard.tsx`

Route: `/kpi/my`

Employee personal KPI dashboard.

Current behavior:

- Fetches the user's active-cycle goal set and recent progress history.
- Draft goals are hidden from the employee.
- Overall progress is weight-normalized.
- Goal cards show progress, target, actual, score, weighted score, status, and update controls.
- Compliance items do not expose employee progress update.
- Sidebar shows recent progress entries through `KpiUpdateHistoryCard`.

API hooks:

- `useGetGoalSetByEmployeeQuery`
- `useGetProgressHistoryQuery`

---

### `TeamKpiDashboard.tsx`

Route: `/kpi/team`

Manager/HR/Admin team overview.

Current behavior:

- HR/Admin use all employees; managers use direct reports.
- Fetches team goal sets for active cycle.
- Search by name/code and sort by name, high progress, or low progress.
- Shows coverage, assigned, and pending stats.
- Bulk Assign Team opens `BulkAssignModal`.
- Row navigation:
  - APPROVED/LOCKED goes to `/kpi/goals/:employeeId`.
  - Other statuses go to `/kpi/assign/:employeeId`.

API hooks:

- `useGetAllEmployeesQuery`
- `useGetDirectReportsQuery`
- `useGetTeamGoalSetsQuery`
- `useBulkAssignKpiMutation` through modal
- `useGetMidcycleSummaryQuery` for phase insights when available

---

### `EmployeeKpiHistory.tsx`

Route: `/kpi/history/:employeeId`

Historical KPI view.

Current behavior:

- Fetches all goal sets for the employee.
- Select dropdown lists cycles with status and calculated local score.
- Displays selected-cycle performance, completion rate, status, and objective list.
- Uses `KpiAuditTable` for the audit trail rather than an inline timeline.
- Audit table supports action filters, date presets, pagination, and a detail modal.

API hooks:

- `useGetEmployeeKpiHistoryQuery`
- `useGetGoalSetAuditTrailQuery`

---

### `KpiCategoryManager.tsx`

Route: `/admin/kpi/categories`

Category CRUD page.

Current behavior:

- Lists categories.
- Supports search.
- Modal create/edit with validation.
- Delete is guarded by confirm and backend requires ADMIN.

API hooks:

- `useGetKpiCategoriesQuery`
- `useCreateKpiCategoryMutation`
- `useUpdateKpiCategoryMutation`
- `useDeleteKpiCategoryMutation`

---

## Components

### `BulkAssignModal.tsx`

Modal for assigning one active library to selected employees.

Current behavior:

- Searches active libraries by title or position.
- Has `overwriteExisting` checkbox.
- Uses active cycle from context for assignment. If opened while viewing another cycle, it shows a notice that assignment targets the current active cycle.
- After mutation, shows success/skipped/failed counts and result rows.

Important note: the `effectiveCycleId` prop is currently used for the historical-cycle notice, but `handleConfirm` submits `activeCycleId`.

---

### `KpiAuditLogModal.tsx`

Compact modal opened from `GoalDetail`.

- Fetches audit trail for a goal set.
- Shows history entries with action, timestamp, actor, summary, and reason where present.

---

### `KpiAuditTable.tsx`

Audit trail table used by `EmployeeKpiHistory`.

- Filters by All, Progress Updates, Goal Changes, and Status Events.
- Filters by last 7 days, last 30 days, or all time.
- Paginates 15 rows per page.
- Opens `KpiLogDetailModal` when a log row is clicked.

---

### `KpiLogDetailModal.tsx`

Detail modal for one `KpiHistoryLog` entry.

- Shows event details, change details, and change reason.

---

### `ProgressUpdateModal.tsx`

Progress update modal.

- Inputs actual value and optional evidence/notes.
- Shows score and weighted-score previews using calculation utilities.
- Calls `useUpdateProgressMutation`.

---

### `KpiRevisionModal.tsx`

Revision modal for privileged users.

- Edits title, category, target value, and weight.
- Requires change reason.
- Calls `useReviseKpiMutation`.

---

### `KpiImportModal.tsx`

Excel import modal.

- Accepts `.xlsx`.
- Calls `useImportLibrariesMutation`.
- Shows import success/failure result details.

### `MidcyclePhaseTimeline.tsx`

Timeline component shown inside `GoalDetail` when midcycle phases exist.

- Displays phase number, dates, weight, score, and current status.
- Shows real-time open-phase projections and scored-phase contributions.
- Works with `MidcycleChangeModal` and refreshes when phase data updates.

### `MidcycleChangeModal.tsx`

Modal launched from `GoalManagement` and `GoalDetail` for privileged users to trigger a midcycle KPI split.

- Shows the currently selected employee and cycle.
- Requires a change date and reason.
- Uses `useTriggerMidcycleChangeMutation` and refreshes midcycle summary on success.

---

### `KpiLibraryHistoryModal.tsx`

Position-level library history modal.

- Fetches all libraries for a position.
- Allows activate/deactivate through `toggleHistoryStatus`.
- Allows delete.
- Activation is exclusive on the backend for the position.

---

### `LibraryKpiTable.tsx`

Editable table used by `KpiLibraryEntry`.

- Columns: title, category, target value, unit, weight, compliance toggle, actions.
- Read-only mode disables inputs.
- Shows weight cap and total-weight feedback.

---

### `KpiGoalCard.tsx`

Employee dashboard goal card.

- Shows title, category, weight, target, actual, score, weighted score, unit, and status.
- Non-compliance items can open progress update.
- Compliance items show manager verification messaging instead of employee update.

---

### `KpiSummaryCard.tsx`

Small metric card used by `MyKpiDashboard`.

---

### `KpiUpdateHistoryCard.tsx`

Recent progress card used by `MyKpiDashboard`.

---

### `KpiTimeline.tsx`

Generic vertical timeline component. It is available but the current history page uses `KpiAuditTable`.

---

## Utility Modules

### `kpiStatusStyles.ts`

Defines shared badge tokens:

```ts
KPI_STATUS_STYLE
KPI_STATUS_FALLBACK
```

Includes keys for frontend display such as `DRAFT`, `APPROVED`, `LOCKED`, `SCORED`, and `ARCHIVED`. `SCORED` is a UI-derived display state.

### `kpiTransformationService.ts`

- `calculateGoalSetMetrics(goalSet)` returns local `finalScore` and `completionRate`.
- Used by `EmployeeKpiHistory`.

### `kpiCalculations.ts`

- `calculateProgressPercent(actual, target)`
- `calculateWeightedScore(actual, target, weight)`
- `validateKpiWeights(items)`
- Priority/status helper functions

### `midcycleApi.ts`

- Exposes `useGetMidcycleSummaryQuery`, `useTriggerMidcycleChangeMutation`, and `useFinalizeCompositeScoreMutation`.
- Used by `GoalDetail`, `GoalManagement`, `MidcycleChangeModal`, and `MidcyclePhaseTimeline`.

### `midcycleTypes.ts`

- Defines `MidcycleChangeRequest`, `MidcyclePhaseResponse`, and `MidcycleSummaryResponse`.

---

## Frontend State Mapping

| Status | Assignment workspace | Goal detail | My dashboard |
|---|---|---|---|
| No goal set | Can create blank/template draft when active cycle | Empty/not-found state | Empty state |
| DRAFT | Editable table; save and approve controls | Approve and modify controls | Items hidden |
| APPROVED | Read-only unless `mode=edit`; Edit Goals can revert | Progress, revise, revert, lock, calculate/recalculate | Goal cards visible; employee updates non-compliance items |
| LOCKED | Read-only | No progress; score can be calculated/recalculated | Visible but update disabled by backend |
| ARCHIVED | Read-only / historical | Archived/read-only banner | Not normally shown as current |
| SCORED | Derived from final score, not backend enum | Final score shown; recalculate available to privileged users | Score data can be displayed where mapped |

---

## Data Flow

```text
User action
  -> RTK Query query/mutation
  -> Spring Boot REST endpoint
  -> ApiResponse<T>
  -> RTK cache/local component state
  -> UI refresh and toast/modal feedback
```

`useAuth` provides user identity, role flags, and active-cycle context used throughout the KPI pages.
