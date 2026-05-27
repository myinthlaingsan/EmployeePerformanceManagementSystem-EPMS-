# KPI Module - Current Backend Flow Analysis

## Overview

The KPI module is a role-driven performance workflow built around reusable KPI libraries, employee goal sets, progress updates, audit history, and final score publishing.

Current lifecycle:

```text
HR/Admin creates active KPI libraries
  -> Manager/HR/Admin assigns goals to employees
  -> Manager/HR/Admin edits draft goals
  -> Manager/direct manager/HR/Admin approves goals
  -> Employee updates normal KPI progress; manager/HR/Admin verifies compliance KPI progress
  -> Manager/HR/Admin locks goals
  -> Manager/HR calculates or recalculates final KPI score
```

`SCORED` is not a persisted `KpiGoalStatus`. The backend enum is only:

```text
DRAFT -> APPROVED -> LOCKED
ARCHIVED is used when a draft goal set is superseded.
```

The UI derives a scored state from the presence of `KpiFinalScore`.

---

## Data Model

```text
KpiLibrary --1:N--> KpiLibraryDetails      Template layer
    |
    +-- Position

KpiGoals --1:N--> KpiGoalItem             Employee/cycle goal layer
    |              +-- KpiProgress         Immutable progress snapshots
    +-- Employee owner
    +-- Employee manager, nullable
    +-- assignedBy / assignedByName
    +-- AppraisalCycle

KpiFinalScore --> Employee + KpiGoals + optional Appraisal
KpiHistoryLog --> KPI journey/audit timeline
KpiCategory   --> KPI item classification
```

Important field distinction:

| Field | Meaning |
|---|---|
| `manager` / `managerId` / `managerName` | The employee's active reporting-line manager. If a manager assigns and no reporting line exists, the assigning manager is used as fallback. HR/Admin assignment does not store HR/Admin as the manager fallback. |
| `assignedBy` / `assignedByName` | The authenticated user who created the goal assignment. |

---

## Backend Endpoints

Base KPI controller: `/api/v1/kpi`

| Method | Endpoint | Roles | Purpose |
|---|---|---|---|
| GET | `/active-cycle` | All | Get active appraisal cycle |
| POST | `/library` | HR, ADMIN | Create KPI library |
| GET | `/library` | All | Active libraries only |
| GET | `/library/all` | All | Active and inactive libraries |
| POST | `/library/import` | HR, ADMIN | Import `.xlsx` KPI libraries |
| GET | `/library/{id}` | All | Get library by id |
| PUT | `/library/{id}` | HR, ADMIN | Update library |
| DELETE | `/library/{id}` | HR, ADMIN | Delete library |
| POST | `/library/{id}/clone?newTitle=` | HR, ADMIN | Clone library |
| GET | `/library/search` | All | Paginated keyword search |
| GET | `/library/history/{positionId}` | All | Library versions for one position |
| PATCH | `/library/{id}/status?active=` | HR, ADMIN | Toggle library active state |
| PATCH | `/library/{id}/toggle-history-status?active=` | HR, ADMIN | Activate/deactivate in position history; activation deactivates other libraries for that position |
| POST | `/assign` | MANAGER, HR, ADMIN | Assign one employee |
| POST | `/bulk-assign` | MANAGER, HR, ADMIN | Assign many employees |
| POST | `/goal-set/{goalSetId}/items` | MANAGER, HR, ADMIN | Add draft item |
| PUT | `/items/{itemId}` | MANAGER, HR, ADMIN | Update draft item |
| DELETE | `/items/{itemId}` | MANAGER, HR, ADMIN | Delete draft item |
| PUT | `/goal-set/{id}/bulk-items` | MANAGER, HR, ADMIN | Bulk update draft items |
| POST | `/approve/{id}` | MANAGER, HR, ADMIN | Approve draft goal set |
| POST | `/goal-set/{id}/revert` | MANAGER, HR, ADMIN | Revert to draft |
| POST | `/goal-set/{id}/lock` | MANAGER, HR, ADMIN | Lock approved goal set |
| POST | `/progress` | EMPLOYEE, MANAGER, HR, ADMIN | Update item progress |
| GET | `/progress/history?employeeId=&limit=` | All | Recent progress entries |
| PUT | `/revise/{itemId}` | MANAGER, HR, ADMIN | Revise item with audit reason |
| POST | `/calculate-score?employeeId=&cycleId=` | MANAGER, HR | Calculate or recalculate final score |
| GET | `/calculate-score?employeeId=&cycleId=` | MANAGER, HR | Get final score, returns null when absent |
| GET | `/goal-set/employee/{employeeId}?cycleId=` | All | Current goal set for employee/cycle |
| GET | `/goal-set/{id}` | All | Goal set by id |
| GET | `/goal-set/employee/all/{employeeId}` | All | All goal sets for employee |
| GET | `/goal-set/team?managerId=&cycleId=` | MANAGER | Team goal sets |
| GET | `/goal-set/department?departmentId=&cycleId=` | HR, ADMIN | Department/all goal sets |

History controller: `/api/v1/kpi-history`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/employee/{employeeId}` | Employee KPI history, access controlled to self, HR/Admin, or direct manager |
| GET | `/goal-set/{goalSetId}/audit` | KPI journey log for one goal set |

Category controller: `/api/v1/kpi/categories`

| Method | Endpoint | Roles | Purpose |
|---|---|---|---|
| GET | `/` | All | List categories |
| GET | `/{id}` | All | Get category |
| POST | `/` | HR, ADMIN | Create category |
| PUT | `/{id}` | HR, ADMIN | Update category |
| DELETE | `/{id}` | ADMIN | Delete category |

Report controller includes KPI reporting at `/api/v1/reports/kpi-achievement` and `/api/v1/reports/kpi-achievement/download`, backed by `ReportServiceImpl.getKpiAchievementReport` and `kpi_achievement_report.jrxml`.

---

## Library Rules

Implemented in `KpiLibraryServiceImpl`.

| Rule | Behavior |
|---|---|
| At least one detail | Required when creating/updating |
| Duplicate titles | Duplicate goal titles inside one library are rejected |
| Individual weight cap | Any item above 35% is rejected |
| Total weight | Must equal 100%, rounded to two decimals for Excel precision |
| Import format | Only `.xlsx` is accepted by the controller |
| Import replacement | Existing active library with same title and position is deactivated before creating the imported active library |
| History activation | Activating one library deactivates the other libraries for the same position |

---

## Assignment Flow

Implemented in `KpiGoalServiceImpl.assignKpiToEmployee`.

1. Validate employee.
2. Validate library only when `libraryId` is provided. This supports blank draft goal-set creation from the frontend.
3. Validate appraisal cycle.
4. Require caller to be MANAGER, HR, or ADMIN.
5. Check current goal sets for employee + cycle.
6. Block overwrite when any current goal set is `APPROVED` or `LOCKED`.
7. If only draft goals exist:
   - `overwriteExisting=true`: archive existing current draft goal sets.
   - `overwriteExisting=false`: reject single assignment.
8. Resolve `manager` from active reporting line. If missing and caller is MANAGER, fallback to caller. HR/Admin does not become manager fallback.
9. Save `KpiGoals` as `DRAFT`, `version=1`, `isCurrent=true`, with `assignedBy`, `assignedByName`, and `assignedAt`.
10. If a library was supplied, copy active library details into `KpiGoalItem` rows with zero progress and `NOT_STARTED` status.
11. Publish `KPI_ASSIGNED`, write `KpiHistoryLog`, and write audit log.

Bulk assignment follows the same core rules per employee, but records `SUCCESS`, `SKIPPED`, or `FAILED` in `BulkAssignmentResponse`. Employees with approved/locked goals are skipped, not hard-failed.

---

## Draft Item Management

Only draft goal sets can be modified through add/update/delete/bulk-update endpoints.

Rules:

| Operation | Rule |
|---|---|
| Add item | Goal set must be DRAFT; item weight must be <= 35% |
| Update item | Goal set must be DRAFT; item weight must be <= 35% |
| Bulk update | Goal set must be DRAFT; each supplied weight must be <= 35% |
| Delete item | Goal set must be DRAFT; blocked when progress records already exist |

Progress-safe changes after approval use the revision endpoint instead of delete/update.

---

## Approval, Revert, Lock

Approval:

1. Caller must be HR/Admin, the goal-set manager, or the employee's direct reporting-line manager.
2. Goal set must be `DRAFT`.
3. Active item weights must total exactly 100%.
4. Status becomes `APPROVED`; `approvedAt` and `approvedBy` are set.
5. Publishes `KPI_APPROVED`, writes `KPI_APPROVED` history, and writes audit log.

Revert:

| Current status | Behavior |
|---|---|
| DRAFT | Returns current goal set without change |
| APPROVED | Reverts to DRAFT |
| LOCKED | Only HR/Admin can revert; manager receives an error |
| ARCHIVED | Rejected |

Revert publishes `KPI_REJECTED` and writes `KPI_REVERTED` history.

Lock:

1. Goal set must be `APPROVED`.
2. Status becomes `LOCKED`.
3. Publishes `KPI_LOCKED`.
4. Writes `KPI_LOCKED` history.

---

## Progress Flow

Implemented in `KpiProgressServiceImpl.updateProgress`.

1. Item's goal set must be `APPROVED`.
2. Auth:
   - Employee can update their own non-compliance items.
   - Manager/HR/Admin can update compliance items for verification.
3. `actualValue` must be in `[0, targetValue]`.
4. Save immutable `KpiProgress`.
5. Recalculate item values:
   - If `targetValue == 0`: score is 100% when actual is 0, otherwise 0%.
   - Otherwise: `scorePercent = min((actual / target) * 100, 100)`.
   - `weightedScore = scorePercent * weightPercent / 100`.
6. Set item status to `NOT_STARTED`, `IN_PROGRESS`, or `COMPLETED`.
7. On completion, notify manager with `KPI_PROGRESS_UPDATED`.
8. Write `PROGRESS_UPDATE` history.

---

## Revision Flow

Implemented in `KpiGoalServiceImpl.reviseKpi`.

1. Caller must be HR/Admin, the assigned manager, or direct reporting-line manager.
2. Goal set must be in an editable lifecycle state supported by the service.
3. Detect field-level changes across title, target value, weight, and category.
4. Reject no-op revisions.
5. Update item in place so progress history remains attached.
6. Increment `KpiGoals.version`.
7. Publish `KPI_REVISED`.
8. Write `ITEM_REVISED` history with diff and change reason.

---

## Final Score Flow

Implemented in `KpiScoringServiceImpl`.

Current behavior is an upsert, not a one-time idempotency block.

1. Find current goal set by employee + cycle.
2. HR/Admin can calculate for anyone. A manager can calculate only when they are the goal-set manager.
3. `ARCHIVED` goal sets are blocked. The previous "must be APPROVED or LOCKED" check is not active in the current service.
4. Inactive employees are blocked.
5. Active item weights must total exactly 100%.
6. `weightedScore` is the sum of item `weightedScore`.
7. `totalAchievementPercent` is the unweighted average of capped item `scorePercent` values.
8. Existing final score for employee + cycle is updated; otherwise a new `KpiFinalScore` is inserted.
9. If an `Appraisal` exists for employee + cycle, it is linked.
10. Publishes `FINAL_RESULT_PUBLISHED`.
11. Writes audit log as INSERT or UPDATE depending on whether the score record already existed.

`GET /calculate-score` returns the score when found and `null` when absent.

---

## History and Access Control

`KpiHistoryServiceImpl` protects KPI history and goal-set audit trails:

| Caller | Access |
|---|---|
| Employee owner | Own history |
| HR/Admin | Any employee |
| Direct reporting-line manager | Direct report history |
| Other users | Rejected |

History responses initialize goal items and item categories inside a read-only transaction before mapping to DTOs.

---

## Notification Events

| Trigger | Notification type | Recipient |
|---|---|---|
| Goal assigned | `KPI_ASSIGNED` | Employee |
| Goal approved | `KPI_APPROVED` | Employee |
| Goal reverted | `KPI_REJECTED` | Employee |
| Goal locked | `KPI_LOCKED` | Employee |
| Goal revised | `KPI_REVISED` | Employee |
| Item completed | `KPI_PROGRESS_UPDATED` | Manager |
| Final score calculated/published | `FINAL_RESULT_PUBLISHED` | Employee |

---

## Frontend Route Alignment

Current KPI frontend routes:

| Route | Component |
|---|---|
| `/kpi` | `KpiHub` |
| `/kpi/my` | `MyKpiDashboard` |
| `/kpi/team` | `TeamKpiDashboard` |
| `/kpi/library` | `KpiLibraryDashboard` |
| `/kpi/library/new` | `KpiLibraryEntry` |
| `/kpi/library/edit/:id` | `KpiLibraryEntry` |
| `/kpi/manage` | `GoalManagement` |
| `/kpi/assign/:employeeId` | `GoalAssignmentWorkspace` |
| `/kpi/goals/:employeeId` | `GoalDetail` |
| `/kpi/history/:employeeId` | `EmployeeKpiHistory` |
| `/admin/kpi/categories` | `KpiCategoryManager` |

`GoalDetail` and `GoalAssignmentWorkspace` both support `?cycleId=`.
`GoalDetail` navigates to assignment edit mode with `?mode=edit`, allowing approved goal sets to be reverted/edited through the assignment workspace.
