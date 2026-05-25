# KPI Frontend Flow — Pages & Components

## Overview

The KPI frontend is a role-driven React module built with RTK Query, React Router, and inline Tailwind/style props. It covers the full KPI lifecycle — from library creation, goal assignment, progress tracking, to final score calculation — with different views for **Employees**, **Managers**, and **HR/Admins**.

---

## Route Map

| Route | Page Component | Accessible By |
|---|---|---|
| `/kpi` | `KpiHub` | All roles |
| `/kpi/library` | `KpiLibraryDashboard` | HR / Admin |
| `/kpi/library/new` | `KpiLibraryEntry` | HR / Admin |
| `/kpi/library/edit/:id` | `KpiLibraryEntry` (edit mode) | HR / Admin |
| `/kpi/manage` | `GoalManagement` | Manager / HR / Admin |
| `/kpi/assign/:employeeId` | `GoalAssignmentWorkspace` | Manager / HR / Admin |
| `/kpi/goals/:employeeId` | `GoalDetail` | Manager / HR / Admin |
| `/kpi/my` | `MyKpiDashboard` | Employee |
| `/kpi/team` | `TeamKpiDashboard` | Manager |
| `/kpi/history/:employeeId` | `EmployeeKpiHistory` | All roles |
| `/admin/kpi/categories` | `KpiCategoryManager` | Admin only |

> **Note:** `GoalDetail` accepts an optional `?cycleId=` query param to view a specific cycle. If omitted it falls back to `activeCycleId`. `GoalAssignmentWorkspace` also accepts `?cycleId=` for historical cycle viewing.

---

## Pages

### 1. `KpiHub.tsx` — System Intelligence Hub

**Route:** `/kpi`  
**Access:** All roles  
**Purpose:** Landing dashboard for the KPI module. Gives every user a high-level picture of the current appraisal cycle.

**Layout (3 stat cards + 2-column grid):**

- **Header** — breadcrumb label ("Enterprise / Performance"), page title "System Intelligence Hub", and active cycle name badge.
- **Stat Row (3 cards):**
  1. *My Performance* — shows the logged-in user's computed overall progress percentage with a thin progress bar. Calculated as `sum(currentProgress / targetValue × weightPercent)` across all non-DRAFT goal items.
  2. *KPI Templates* (HR/Admin only) / *Assigned KPIs* (Employee) — for HR/Admin shows total active library count with a clickable card that navigates to `/kpi/library`. For employees shows the number of active goal items for this cycle.
  3. *Goal Status* — shows the current `KpiGoals.status` string (DRAFT / APPROVED / LOCKED) or "No Active Goals".
- **Active Goals panel (left)** — lists up to 3 goal items as compact rows showing title, weight %, current completion %, and a micro progress bar. Clicking any row or the "View All" button navigates to `/kpi/my`. Shows an empty-state placeholder with a `Target` icon when no goals exist.
- **Right column:**
  - *Strategic Control panel* (HR/Admin only) — dark (#111827) card with two action buttons: **Assign Goals** (→ `/kpi/manage`) and **Create Template** (→ `/kpi/library/new`).
  - *System Sync card* — static info card indicating last data sync time.

**API calls:**
- `useGetAllLibrariesQuery` — fetches active KPI library count.
- `useGetGoalSetByEmployeeQuery({ employeeId, cycleId })` — fetches logged-in user's current goal set.

---

### 2. `KpiLibraryDashboard.tsx` — Library Management

**Route:** `/kpi/library`  
**Access:** HR / Admin  
**Purpose:** Browse, activate/deactivate, clone, delete, and import KPI library templates.

**Layout:**

- **Header** with title + "New Library" button (→ `/kpi/library/new`) and "Import" button that opens `KpiImportModal`.
- **Filter bar** — position dropdown and keyword search input to filter the library grid.
- **Grid / List toggle** — switches between card grid view and compact list view.
- **Library cards** — each card shows: template title, linked position name, number of KPI items, active/inactive status badge, and action buttons (Edit, Clone, Activate/Deactivate, History, Delete).
  - *Activate* calls `PATCH /library/{id}/toggle-history-status` which exclusively deactivates all other libraries for that position.
  - *Clone* creates a copy via `POST /library/{id}/clone?newTitle=`.
  - *History icon* opens `KpiLibraryHistoryModal` for that position.
- **`KpiImportModal`** — opened by the Import button; accepts `.xlsx` file upload and calls `POST /library/import`.
- **`KpiLibraryHistoryModal`** — shows all versions of libraries for a given position with activate/deactivate/delete actions per version.

**API calls:**
- `useGetAllLibrariesQuery` / `useGetAllLibrariesWithInactiveQuery` (incl. inactive).
- `useToggleHistoryStatusMutation`, `useDeleteLibraryMutation`.

---

### 3. `KpiLibraryEntry.tsx` — Create / Edit Library Template

**Route:** `/kpi/library/new` or `/kpi/library/edit/:id`  
**Access:** HR / Admin  
**Purpose:** Form page for creating or editing a KPI library template, combining basic metadata with a detailed KPI items table.

**Layout (2-section form):**

- **`LibraryBasicInfo` component (top section)** — three fields:
  1. Template title (text input).
  2. Target position (select dropdown, fetched from positions API).
  3. Description (textarea).
- **`LibrarySyncInfo` component** — amber alert banner showing the two validation rules that the form will enforce before save: total weight must equal 100%, no single item weight may exceed 35%.
- **`LibraryKpiTable` component (main section)** — editable table of KPI items (see component docs below).
- **Footer action bar** — "Cancel" button + "Save Library" button. Save triggers weight validation; on error, highlights the failing rule in the `LibrarySyncInfo` banner.

**API calls:**
- `useCreateLibraryMutation` (new) / `useUpdateLibraryMutation` (edit).
- `useGetLibraryByIdQuery` (pre-fills form in edit mode).
- `useGetAllPositionsQuery` (position dropdown).
- `useGetKpiCategoriesQuery` (category dropdown inside `LibraryKpiTable`).

---

### 4. `GoalManagement.tsx` — Organisation-Wide Goal Assignment

**Route:** `/kpi/manage`  
**Access:** Manager / HR / Admin  
**Purpose:** Overview page for filtering employees by department, position, or cycle, viewing goal statuses, and bulk-assigning KPI library templates.

**Layout:**

- **Header** — page title, active cycle badge, and **Bulk Assign Templates** button (enabled only when employees are selected and viewing the active cycle; disabled in historical mode).
- **Filter bar** — keyword search, Department dropdown, Position dropdown, and Appraisal Cycle dropdown. The cycle dropdown groups cycles into "Active Cycle" and "Historical / Other Cycles" optgroups.
- **Historical cycle banner** — amber warning strip shown when viewing any cycle other than the active one; assignments are blocked in this mode.
- **Employee table** — paginated (10 per page). Columns: checkbox (hidden in historical mode), Employee (name + email), Department, Position, Goal Status badge. Clicking a row navigates to:
  - `/kpi/goals/:employeeId?cycleId=...` when status is `APPROVED` or `LOCKED`.
  - `/kpi/assign/:employeeId?cycleId=...` for all other statuses.
  - ARCHIVED employees are not clickable.
- **Pagination footer** — shows "X–Y of Z" count and Previous / Next buttons.

**API calls:**
- `useGetEmployeesQuery({ page, size })` — paginated employee list.
- `useGetDepartmentGoalSetsQuery({ cycleId })` (HR/Admin) / `useGetTeamGoalSetsQuery({ managerId, cycleId })` (Manager) — for goal status per employee.
- `useGetDepartmentsQuery`, `useGetPositionsQuery`, `useGetCyclesQuery` — filter dropdowns.

---

### 5. `GoalAssignmentWorkspace.tsx` — Per-Employee Goal Assignment Editor

**Route:** `/kpi/assign/:employeeId`  
**Access:** Manager / HR / Admin  
**Purpose:** The main workspace for building or editing a specific employee's goal set for the active (or a historical) cycle. Combines a template sidebar with an inline-editable goal table.

**Historical cycle mode:** When `?cycleId=` points to a past cycle (`isHistoricalCycle=true`), the sidebar is hidden, all inputs are disabled, and an amber banner reads "Viewing historical cycle — no assignments can be made."

**Layout (back button + header card + optional sidebar + table):**

- **Back button** — `safeNavigate(-1)` with an unsaved-changes guard (`window.confirm`).
- **Header card** — employee avatar (initial letter), full name, employee code, position, cycle name, current goal-set status badge (from `KPI_STATUS_STYLE`), and a "View History" button (→ `/kpi/history/:employeeId`). Right side shows context-sensitive action buttons:
  - When `APPROVED` → **Edit Goals** button (calls `revertToDraft`; guarded by `window.confirm`).
  - When `DRAFT` or no goal set → **Save Draft** button (blue when `isModified=true`, grey otherwise) + **Approve Goal Set** button (disabled unless `totalWeight === 100` and `!isModified`; calls `approveGoalSet` then navigates to `/kpi/manage` or `/kpi/team`).
  - When `LOCKED`, `SCORED`, or `ARCHIVED` → no action buttons shown.
- **Assignment Info Callout** — displayed when a goal set exists; shows three separate fields:
  - *Assigned Manager* — `goalSet.managerName (ID: managerId)`. Displays **"Not Assigned"** when null.
  - *Assigned By* — `goalSet.assignedByName (ID: assignedBy)` — shown only when present.
  - *Assigned At* — ISO timestamp formatted to `toLocaleString()`.
- **No Cycle Specified guard** — if `resolvedCycleId` is null (no active cycle and no `?cycleId=` param), renders a centred error card with a "Go Back" button.
- **Template Sidebar (left, 288px — hidden in historical mode):**
  - "Replace Existing Goals" checkbox — when checked, clicking a template calls `assignLibrary` with `overwriteExisting=true` (archives old goal set); when unchecked, appends the template's items.
  - Template search input (live filters `filteredLibraries`).
  - Scrollable list of library cards — each shows position badge, template title, and `+` icon. Clicking calls `handleUseTemplate`.
  - "Start Blank Session" button — shown only when no goal set exists **and** `localItems` is empty; creates an empty row via `handleAddCustomGoal`.
  - "Add Custom Goal" button — always visible; calls `handleAddCustomGoal` which adds a local temp row with `_isNew=true`. Nothing is saved until "Save Draft" is clicked.
- **Goal Assignments Table (main area):**
  - Columns: Goal Title, Category, Target, Unit, Weight %, (delete).
  - All cells are **inline-editable inputs** while status is `DRAFT` and not a historical cycle; they become read-only when `APPROVED`, `LOCKED`, or `isHistoricalCycle`.
  - Weight input turns red/highlighted with "Max 35%" warning text when > 35%.
  - Category cell is a `<select>` populated from `useGetKpiCategoriesQuery`.
  - Delete button (trash icon) removes temp items locally (`_isNew=true`); for persisted items calls `deleteGoalItem`. Hidden/disabled when inputs are disabled.
  - "Add New Goal Row" button at the bottom of the table (hidden in historical mode).
- **Aggregate Weight footer:**
  - Live `totalWeight` percentage calculated from `localItems`.
  - Progress bar turns green at exactly 100%, red above 100%, blue below.
  - Status label: "Verified" / "Exceeded by X%" / "X% Remaining".
  - Over-cap warning: "N items exceed 35% cap".

**State management:**
- `localItems` — local copy of `goalSet.items` that drives the table; synced from API on mount/refetch. New rows have `_isNew: true` and a negative temp ID.
- `isModified` — set `true` on any inline edit or new row addition; cleared after a successful save.
- `overwriteExisting` — checkbox state for template application mode.
- `isHistoricalCycle` — true when `resolvedCycleId !== activeCycleId`.
- `isInputDisabled` — true when `isHistoricalCycle || status === 'APPROVED' || status === 'LOCKED'`.
- Browser `beforeunload` event warns the user when there are unsaved changes.

**Save Draft flow (multi-step):**
1. If no goal set exists, create one via `assignLibrary` with no `libraryId`.
2. For each `_isNew` item, call `addGoalItem` and replace the temp row with the real API response.
3. Bulk-update all persisted items via `bulkUpdateItems`.
4. Refetch and clear `isModified`.

**API calls:**
- `useGetGoalSetByEmployeeQuery`, `useGetAllLibrariesQuery`, `useGetKpiCategoriesQuery`.
- `useGetEmployeeByIdQuery` (employee details for header).
- `useGetCyclesQuery` (cycle name lookup).
- `useAssignKpiToEmployeeMutation`, `useAddGoalItemMutation`, `useDeleteGoalItemMutation`.
- `useBulkUpdateGoalItemsMutation`, `useApproveGoalSetMutation`, `useRevertGoalSetMutation`.

---

### 6. `GoalDetail.tsx` — Goal Set Detail View

**Route:** `/kpi/goals/:employeeId` + optional `?cycleId=` query param  
**Access:** Manager / HR / Admin (owner employee can also view and update progress)  
**Purpose:** Read/manage view for a single employee's goal set for a given cycle. Fetches by `employeeId` + `cycleId`. Provides the full lifecycle actions: approve, revert, lock, calculate score, and item-level revisions.

**Layout:**

- **Header row:**
  - Back button (`navigate(-1)`).
  - Title: `{employeeName}'s Performance Goals`.
  - Metadata subtitle: Cycle ID, Manager (or "Not Assigned"), Assigned By (if present), Assigned At date — separated by `•` characters.
  - Action buttons (right side):
    - **History** button — opens `KpiAuditLogModal` (visible to privileged users and the owner).
    - **Modify Goals** button (→ `/kpi/assign/:employeeId?cycleId=`) — shown when status is `DRAFT` or `APPROVED`.
    - **Approve Goals** button — shown when status is `DRAFT`; calls `approveGoalSet`.
    - **Revert to Draft** button — shown when status is `APPROVED`; opens a custom confirmation modal that lists the consequences (KPI_REJECTED notification, re-approval required, progress preserved); calls `revertGoal` on confirm.
    - **Lock Goals** button — shown when status is `APPROVED`; guarded by `window.confirm`; calls `lockGoal`.
    - **Calculate Score** button — shown when status is `LOCKED`; calls `calculateScores`.
- **Visual Stepper** — horizontal step indicator showing four stages: `DRAFT → APPROVED → LOCKED → SCORED`. Current stage is highlighted (blue border); completed stages are filled blue. `SCORED` is a derived state: true when a `KpiFinalScore` record exists (`isScoredState = !!finalScore`), not an enum value. If status is `ARCHIVED`, the stepper is replaced by an archived-state banner.
- **Summary cards (3):**
  - *Total Weight* — sum of all item `weightPercent`; blue when 100%, red otherwise.
  - *KPI Count* — total number of goal items.
  - *Execution Status* — "Active" (APPROVED), "Locked" (LOCKED), "Scored" (isScoredState), or "Pending".
- **Final Score Card** — shown only when `isScoredState=true`; green gradient card displaying `finalScore.weightedScore`, `totalAchievementPercent`, and calculation date.
- **KPI Items Table** — inline table (not `LibraryKpiTable` component). Compliance items have a yellow (#FEFCE8) row background and a `ShieldCheck` icon. Columns: KPI Item (title + category), Weight, Target, Progress (bar + %), Actions.
  - Employee owner sees **UPDATE** button for non-compliance items (APPROVED status only) and a **MANAGER ONLY** locked badge for compliance items.
  - Privileged users see **VERIFY** button for unverified compliance items (shows verified date/by when already verified) and **REVISE** button for all non-LOCKED/non-ARCHIVED items.
  - Progress update opens `ProgressUpdateModal`; revision opens `KpiRevisionModal`.

**API calls:**
- `useGetGoalSetByEmployeeQuery({ employeeId, cycleId })` — primary data fetch.
- `useGetFinalScoreQuery({ employeeId, cycleId })` — skipped unless status is `LOCKED`.
- `useApproveGoalSetMutation`, `useRevertGoalSetMutation`, `useLockGoalSetMutation`, `useCalculateScoresMutation`.
- `useReviseKpiMutation` (via `KpiRevisionModal`).

---

### 7. `MyKpiDashboard.tsx` — Employee Personal KPI Dashboard

**Route:** `/kpi/my`  
**Access:** Employee (own data only)  
**Purpose:** Employee-facing view showing their current cycle's goals, individual progress, and recent update history. Goal items are hidden from the employee when the goal set is in `DRAFT` status.

**Layout:**

- **Header** — page title, cycle name, and two `KpiSummaryCard` widgets: Overall Progress (`color="blue"`) and Active Goals count (`color="indigo"`).
- **Overall progress** — displayed in the `KpiSummaryCard`; computed by `(Σ progressPercent × weightPercent) / Σ weightPercent` (weight-normalized, not raw sum).
- **Goal cards list (2/3 width)** — one `KpiGoalCard` per goal item showing: title, category badge, weight %, target, actual value, score %, weighted score, unit, item status, and a progress bar.
  - Non-compliance items show a **"Start Goal"** / **"Update Progress"** button that opens `ProgressUpdateModal`.
  - Compliance items show a **"Verified by Manager"** badge (no update button for employee).
- **Empty states:**
  - DRAFT status → "Goals are being drafted / Your manager is working on your goals for this cycle."
  - No goals → "No goals assigned yet / Wait for your manager to set up your objectives."
- **`KpiUpdateHistoryCard`** (sidebar, 1/3 width) — recent progress entries fetched with `limit=3`.

**API calls:**
- `useGetGoalSetByEmployeeQuery({ employeeId: self, cycleId })`.
- `useGetProgressHistoryQuery({ employeeId: self, limit: 3 })`.

---

### 8. `TeamKpiDashboard.tsx` — Manager's Team Overview

**Route:** `/kpi/team`  
**Access:** Manager (and HR/Admin who see all employees)  
**Purpose:** Dashboard showing all direct reports (or all employees for HR/Admin) and their KPI goal status for the current cycle.

**Data source:** HR/Admin use `useGetAllEmployeesQuery`; Managers use `useGetDirectReportsQuery`. Team goal sets from `useGetTeamGoalSetsQuery`.

**Layout:**

- **Header** — page title, cycle subtitle, search input, Download Report button (static), **Bulk Assign Team** button.
- **Coverage stats (3 cards):**
  1. *Goal Assignment* — coverage percentage with progress bar, showing assigned-of-total count.
  2. *Assigned* — count of active goal sets.
  3. *Pending* — count of employees without goals.
- **Sort control** — filter dropdown to sort the table by Name (A-Z), High Progress, or Low Progress.
- **Goal tracking table** — one row per team member. Columns: checkbox (for bulk assign), Direct Report (avatar initials + name + position), Goal Status badge, KPI Items count, Cycle name, Progress (bar + %). Clicking a row navigates to:
  - `/kpi/goals/:employeeId` when status is `APPROVED` or `LOCKED`.
  - `/kpi/assign/:employeeId` for all other statuses.
- **Bulk Assign button** — opens `BulkAssignModal` for selected employees.

**API calls:**
- `useGetAllEmployeesQuery` (HR/Admin) or `useGetDirectReportsQuery` (Manager).
- `useGetTeamGoalSetsQuery({ managerId, cycleId })`.
- `useBulkAssignKpiMutation` (via `BulkAssignModal`).

---

### 9. `EmployeeKpiHistory.tsx` — KPI History Timeline

**Route:** `/kpi/history/:employeeId`  
**Access:** All roles  
**Purpose:** Historical view of all KPI cycles for a given employee — past goal sets, performance scores, and the full audit trail per cycle.

**Layout:**

- **Header** — back button, page title "KPI Performance History", subtitle.
- **Cycle Selector** — a `<select>` dropdown listing all historical goal sets formatted as `{cycleName} ({status}) — {score}%`. Selection drives the detail pane below. Uses `calculateGoalSetMetrics` utility to compute the score shown in each option.
- **Empty state** — shown when the employee has no history records.
- **Selected cycle detail pane (3 sections):**
  - *Metric cards (3):* Cycle Performance Score (weighted, from `calculateGoalSetMetrics`), Goal Completion Rate (average item completion %), and Cycle Status badge.
  - *Assigned Objectives list* — one row per goal item showing title, weight %, current progress value, and a progress bar. Ordered as returned from API.
  - *Goal Journey audit trail* — vertical timeline of `KpiHistoryLog` entries. Each entry shows: action badge (colour-coded by type), timestamp (formatted `dd/MM/yyyy, h:mm a`), change details string, and change reason in a quoted note box. Uses `useGetGoalSetAuditTrailQuery` triggered when a cycle is selected.

**API calls:**
- `useGetEmployeeKpiHistoryQuery(employeeId)` — fetches all historical goal sets via `/api/v1/kpi-history/employee/{employeeId}`.
- `useGetGoalSetAuditTrailQuery(goalSetId)` — fetches audit log entries via `/api/v1/kpi-history/goal-set/{goalSetId}/audit`. Skipped until a cycle is selected.

---

### 10. `KpiCategoryManager.tsx` — KPI Category Management (Admin)

**Route:** `/admin/kpi/categories`  
**Access:** Admin only  
**Purpose:** Full CRUD management of KPI categories used to classify goal items across all libraries and goal sets.

**Layout:**

- **Header** — breadcrumb "Framework › Categories", page title, "Create New Category" button.
- **Search bar** — live keyword filter over the category list.
- **Category table** — lists all categories with name and action buttons (Edit, Delete).
- **Create/Edit modal** — single text field for category name with Save/Cancel. Validates that name is non-empty. On save calls `createCategory` or `updateCategory`.
- **Delete** — `window.confirm` guard then calls `deleteCategory`.

**API calls:**
- `useGetKpiCategoriesQuery`, `useCreateKpiCategoryMutation`, `useUpdateKpiCategoryMutation`, `useDeleteKpiCategoryMutation`.

---

## Components

### `LibraryBasicInfo.tsx`

A controlled form section rendered inside `KpiLibraryEntry`. Contains three fields — Title (text input), Target Position (select from positions API), and Description (textarea). Props: `value` object + `onChange` handler. Stateless — parent owns form state.

---

### `LibrarySyncInfo.tsx`

Static informational `<div>` (amber/warning style) displayed at the top of `KpiLibraryEntry`. Lists the two validation rules for library submission:
1. Total weight of all items must equal exactly **100%**.
2. No single item weight may exceed **35%**.

No props. No interactivity.

---

### `LibraryKpiTable.tsx`

Reusable editable table for KPI items. Used in `KpiLibraryEntry` (write mode). **Not used in `GoalDetail`** — that page has its own inline table.

**Columns:** Title, Category (select), Target Value (number), Unit (text), Weight % (number), Is Compliance (toggle), Actions (delete).

**Props:**
- `items` — array of KPI item objects.
- `categories` — list for the category dropdown.
- `readOnly` — boolean; disables all inputs when `true`.
- `onChange(items)` — callback fired on any cell edit.
- `onDelete(index)` — callback for row deletion.

**Validation indicators:**
- Weight field turns red when value > 35.
- Footer row shows live total weight sum with colour coding (green = 100%, red = over, blue = under).

---

### `KpiGoalCard.tsx`

Card component used in `MyKpiDashboard`. Renders a single goal item as a styled card (Tailwind classes) with: category badge, weight %, title, description placeholder, target, actual, score %, weighted score, unit, and item status indicator.

- Non-compliance items: shows **"Start Goal"** (if `progress === 0`) or **"Update Progress"** button that fires `onUpdate(kpi)`.
- Compliance items: shows a static **"Verified by Manager"** badge (no update button for employee).

**Props:** `kpi: GoalItemResponse`, `idx: number`, `onUpdate: (kpi) => void`.

---

### `ProgressUpdateModal.tsx`

Modal dialog for submitting a KPI progress update.

**Fields:**
- Actual Value (number input, bounded 0 → targetValue).
- Evidence / Notes (textarea, optional).

**Computed display:**
- Score % preview: `(actualValue / targetValue) × 100`.
- Weighted score preview.

On submit, calls `POST /api/v1/kpi/progress`. Shows toast on success/failure. Closes modal after successful save.

---

### `KpiRevisionModal.tsx`

Modal for revising a goal item's metadata. Accessible from `GoalDetail` for non-LOCKED/non-ARCHIVED goal sets.

**Fields:**
- Goal Title (text).
- Category (select).
- Target Value (number).
- Weight % (number).
- Change Reason (textarea, **required** for audit trail).

On submit, calls `PUT /api/v1/kpi/revise/{itemId}`. API will reject if no field actually changed (no-op guard). Bumps `KpiGoals.version` on success.

---

### `KpiAuditLogModal.tsx`

Timeline modal showing the full revision history of a goal set from `KpiHistoryLog`. Opened from `GoalDetail` via the **History** button.

**Each entry shows:**
- Event type badge (e.g. `KPI_ASSIGNED`, `ITEM_REVISED`, `PROGRESS_UPDATE`, `KPI_APPROVED`).
- Timestamp (formatted date + time).
- Actor name (who made the change).
- Diff string — parsed old→new field values for revision events.
- Change reason (for `ITEM_REVISED` events).

Entries are sorted newest-first. Modal is scrollable for long histories.

---

### `BulkAssignModal.tsx`

Multi-step modal for bulk assigning a KPI library template to multiple employees at once.

**Step 1 — Employee selection:**
- Checkbox list of employees (pre-selected from the calling page's filter).
- Select All / Deselect All toggle.

**Step 2 — Template selection:**
- Dropdown of active KPI libraries.
- "Overwrite existing goals" checkbox (APPROVED/LOCKED employees are always skipped regardless).

**Step 3 — Result report:**
- After `POST /kpi/bulk-assign`, shows per-employee success / skipped / failed rows.
- Skipped = employee already had APPROVED or LOCKED goals and overwrite was off.
- Failed = API error for that employee.

**Props:** `selectedEmployeeIds`, `effectiveCycleId` (optional), `onClose`, `onSuccess`.

---

### `KpiImportModal.tsx`

File upload modal for importing KPI library templates from an Excel file (`.xlsx` only).

**UI:**
- Drag-and-drop zone with a dashed border and upload icon.
- File name preview after selection.
- "Import" button calls `POST /library/import`.

**Result display:**
- Success count.
- Failed count with per-row error descriptions.

---

### `KpiLibraryHistoryModal.tsx`

Expandable modal showing all versions of KPI libraries ever created for a given position. Displayed as a vertical list ordered newest-first.

**Each version row shows:**
- Library title and creation date.
- Status badge (ACTIVE / INACTIVE).
- Action buttons: Activate (exclusive → deactivates others), Deactivate, Delete.

Activate calls `PATCH /library/{id}/toggle-history-status` which ensures only one version is active per position.

---

### `KpiSummaryCard.tsx`

Small metric display card. **Props:** `label` (string), `value` (string | number), `icon` (Lucide icon component), `color` (string, defaults to `"blue"` — used as Tailwind colour prefix for background/text). Used in `MyKpiDashboard` header stat row. Purely presentational.

---

### `KpiUpdateHistoryCard.tsx`

Sidebar card rendered in `MyKpiDashboard` showing the N most recent progress update entries for the logged-in employee.

**Each entry:** goal item title, submitted actual value, date/time of submission. Fetched via `GET /api/v1/kpi/progress/history?employeeId=&limit=`.

---

### `KpiTimeline.tsx`

Generic vertical timeline visualisation component. Each milestone entry takes a `label`, `date`, `status` (done / active / pending), and optional `description`. Renders a vertical line with circle nodes; active node is filled blue, done nodes are filled green with a checkmark, pending nodes are grey.

> **Note:** This component is **not currently used** by `EmployeeKpiHistory` — that page now uses an inline audit trail rendering instead of `KpiTimeline`.

---

## Utility Modules

### `kpiStatusStyles.ts`

Canonical badge style tokens imported by every component that renders a goal-set status badge.

```ts
KPI_STATUS_STYLE: Record<string, KpiStatusStyle>
// Keys: DRAFT | APPROVED | LOCKED | SCORED | ARCHIVED
// Each: { bg, text, border, label }

KPI_STATUS_FALLBACK: KpiStatusStyle
// Used for unknown/undefined statuses
```

Used in: `GoalManagement`, `GoalAssignmentWorkspace`, and `KpiCategoryManager`.

---

### `kpiTransformationService.ts`

Shared calculation utilities for enriching goal set data.

- `calculateGoalSetMetrics(goalSet)` → `{ finalScore, completionRate }` — computes weighted final score and average item completion from `items`. Used in `EmployeeKpiHistory`.
- `enrichGoalSet(goalSet)` → `EnrichedGoalSet` — spreads metrics onto the response object.
- `enrichGoalSets(goalSets[])` → maps `enrichGoalSet` over an array.

---

### `kpiCalculations.ts`

Low-level calculation helpers.

- `calculateProgressPercent(actual, target)` — returns `min(round(actual/target × 100), 100)`.
- `calculateWeightedScore(actual, target, weight)` — returns `(actual/target) × weight`.
- `validateKpiWeights(items)` → `{ totalWeight, isValid, errors[] }` — enforces total = 100%, each item ≥ 5% and ≤ 35%.
- `PRIORITY_MAP` — maps priority tiers (CRITICAL / HIGH / MEDIUM / LOWER) to weight ranges and Tailwind colour strings.
- `getPriorityFromWeight(weight)` — derives a priority tier from a weight number.
- `getStatusColor(progress)` — returns Tailwind colour classes based on progress percentage.

---

## Data Flow Summary

```
User Action
    │
    ▼
RTK Query mutation / query  ──▶  Spring Boot REST API
    │                                    │
    │◀── API response (ApiResponse<T>) ──┘
    │
    ▼
Redux store / component local state
    │
    ▼
Re-render → updated UI (toast notification on mutation success/error)
```

**Auth context (`useAuth`)** provides: `user.id`, `isHR`, `isAdmin`, `isManager`, `activeCycleId`, `activeCycleName`, `hasCycle`, `cycleError`, `isLoadingCycle` — used by every page to gate role-specific UI sections and skip irrelevant queries.

---

## Goal Status → UI State Mapping

| Goal Status | GoalAssignmentWorkspace | GoalDetail | MyKpiDashboard |
|---|---|---|---|
| `(none)` | "Not Assigned" badge; sidebar active | 404 / empty state | Empty state |
| `DRAFT` | Inline table editable; Save + Approve btns | Approve + Modify Goals btns | Items hidden — "Goals are being drafted" |
| `APPROVED` | Table read-only; "Edit Goals" btn to revert | Revert + Lock + Modify Goals btns | Goal cards visible; Update Progress active |
| `LOCKED` | Table read-only; no edit btns | Calculate Score btn | Goal cards visible; Update Progress disabled |
| `SCORED` | Read-only (no btns) | Final Score Card shown; stepper at SCORED | Final score visible |
| `ARCHIVED` | Not shown (historical only) | Archived banner shown; no action btns | Not shown |

> **SCORED** is a derived UI state (not a `KpiGoalStatus` enum value). It is true when `useGetFinalScoreQuery` returns a `KpiFinalScore` record for the employee + cycle.

---

## Manager vs Assigned By — Field Distinction

These two fields serve different purposes and must not be confused:

| Field | Source | Meaning |
|---|---|---|
| `manager` / `managerId` / `managerName` | Employee's active `ReportingLine.manager` | The employee's direct reporting manager — responsible for approving goals |
| `assignedBy` / `assignedByName` | Currently authenticated user at time of assignment | The person who created the goal assignment (may be HR, Admin, or Manager) |

**Rules (enforced in `KpiGoalServiceImpl`):**
- When a **Manager** assigns and the employee has no reporting line → `manager` falls back to the assigning manager (same person).
- When **HR or Admin** assigns and the employee has no reporting line → `manager` is left `null`. HR is never stored as the employee's manager.
- `assignedBy` always records who performed the action, regardless of role.

**UI behaviour:**
- Both `GoalDetail` and `GoalAssignmentWorkspace` display Manager and Assigned By as separate labelled fields.
- A null `manager` renders as **"Not Assigned"** in both pages.
