# KPI Permission and Access Impact Analysis

## Scope

This document analyzes how permissions and roles affect the KPI module across frontend and backend.

The current implementation uses two related but different access systems:

1. Backend enforcement through Spring Security roles and service-level ownership checks.
2. Frontend visibility through seeded permission names such as `KPI_VIEW_OWN`, `KPI_CREATE`, and `KPI_APPROVE`.

The important impact is that frontend permissions mostly control navigation and buttons, while backend roles decide whether API calls succeed.

---

## Permission Source Model

### Backend authority construction

`UserDetailsServiceImpl` loads:

- Role authorities such as `ROLE_ADMIN`, `ROLE_HR`, `ROLE_MANAGER`, `ROLE_EMPLOYEE`.
- Permission authorities from role-level permission assignments, such as `KPI_CREATE`.

However, most KPI backend endpoints currently use role checks, not permission checks.

### Seeded KPI permissions

`DataInitializer` seeds these KPI permissions:

| Permission | Intended frontend meaning |
|---|---|
| `KPI_VIEW_OWN` | Show own KPI dashboard/history links |
| `KPI_VIEW_TEAM` | Show team performance link |
| `KPI_VIEW_ALL` | Intended all-KPI visibility, currently not widely used in KPI pages |
| `KPI_CREATE` | Show goal assignment/edit/revision controls |
| `KPI_APPROVE` | Show approve/revert/lock/verify controls |
| `KPI_LIBRARY_MANAGE` | Show library/category/management navigation and library actions |

These permissions are useful for UX gating, but they are not the main backend enforcement mechanism.

---

## Frontend Permission Enforcement

### Route-level gates

In `App.tsx`, KPI routes are grouped as:

| Route group | Frontend gate | Impact |
|---|---|---|
| `/kpi`, `/kpi/my`, `/kpi/goals/:employeeId`, `/kpi/history/:employeeId` | Authenticated only | Any logged-in user can reach these routes directly. Backend/data checks must protect sensitive records. |
| `/kpi/team`, `/kpi/manage`, `/kpi/assign/:employeeId` | `allowedRoles=["MANAGER","ADMIN","HR"]` | Employees cannot open assignment/team pages directly. |
| `/kpi/library`, `/kpi/library/new`, `/kpi/library/edit/:id`, `/kpi/categories` | `allowedRoles=["ADMIN","HR"]` | Managers cannot open library/category pages even if they somehow have `KPI_LIBRARY_MANAGE`. |

### Sidebar visibility

The sidebar uses permission names:

| Link | Permission gate |
|---|---|
| `/kpi/my` | `KPI_VIEW_OWN` |
| `/kpi/team` | `KPI_VIEW_TEAM` |
| `/kpi/history/{self}` | `KPI_VIEW_OWN` |
| `/kpi/manage` | `KPI_LIBRARY_MANAGE` |
| `/kpi/library` | `KPI_LIBRARY_MANAGE` |
| `/kpi/categories` | `KPI_LIBRARY_MANAGE` |

Impact:

- A user can have a route role but not see the sidebar link if the permission is missing.
- A user can see a sidebar link but still be blocked by route role if their role is not allowed.
- `/kpi/categories` appears in the sidebar, but the actual route in `App.tsx` is `/kpi/categories`, while the earlier route docs also mention `/admin/kpi/categories`. The rendered app currently uses `/kpi/categories`.

### Component-level gates

`Can` checks `hasPermission` and optional `hasRole`.

Important KPI usages:

| UI area | Gate | Impact |
|---|---|---|
| KpiHub Assign Goals | `KPI_CREATE` plus HR/Admin role block around panel | HR/Admin without `KPI_CREATE` sees the panel but not the action. |
| KpiHub Create Template | `KPI_LIBRARY_MANAGE` plus HR/Admin panel | HR/Admin without library permission cannot create from hub. |
| KpiLibraryDashboard actions | `KPI_LIBRARY_MANAGE` | Users can browse page if HR/Admin route allows, but actions are hidden without permission. |
| GoalDetail Modify/Revisions | `KPI_CREATE` plus privileged role (`MANAGER`, HR, ADMIN) | A manager without `KPI_CREATE` can reach the route but cannot see modify/revise controls. |
| GoalDetail Approve/Revert/Lock/Verify | `KPI_APPROVE` plus privileged role | A manager without `KPI_APPROVE` cannot see these controls. |
| GoalDetail employee progress UPDATE | Currently wrapped in `KPI_CREATE` | This is probably mismatched: employees normally need progress update capability, but `KPI_CREATE` sounds manager/admin-oriented. Backend allows employees to update their own progress if the goal set is approved. |
| GoalDetail Calculate/Recalculate Score | Role-based `isPrivileged`, no `Can` permission | A manager/HR/Admin may see score calculation even without `KPI_APPROVE` or a report permission. Backend still enforces role/manager constraints. |

---

## Backend Role Enforcement

### Controller-level access

Base KPI endpoints use `@PreAuthorize` mostly by role:

| Backend operation | Controller role gate |
|---|---|
| Create/update/import/delete/toggle library | HR, ADMIN |
| Assign and bulk assign goals | MANAGER, HR, ADMIN |
| Add/update/delete/bulk-update goal items | MANAGER, HR, ADMIN |
| Approve goal set | MANAGER, HR, ADMIN |
| Update progress | EMPLOYEE, MANAGER, HR, ADMIN |
| Revise KPI item | MANAGER, HR, ADMIN |
| Calculate/get final score | MANAGER, HR |
| Team goal sets | MANAGER only at controller |
| Department goal sets | HR, ADMIN |
| Category create/update | HR, ADMIN |
| Category delete | ADMIN |

Impact:

- Backend does not currently require named permissions such as `KPI_CREATE` or `KPI_APPROVE` for KPI mutations.
- If a user has `ROLE_MANAGER` but lacks frontend `KPI_CREATE`, the UI hides assignment/edit buttons, but a direct API call to role-allowed endpoints can still pass controller role checks.
- If a user has `KPI_CREATE` but lacks `ROLE_MANAGER`/`ROLE_HR`/`ROLE_ADMIN`, the UI may show some permission-gated elements in places that are otherwise route-limited, but the backend will reject protected mutations.

---

## Service-Level Business Access Checks

Controller roles are only the first layer. Several services add ownership/relationship constraints.

### Goal assignment

`assignKpiToEmployee` requires caller to be MANAGER, HR, or ADMIN. It also affects manager attribution:

| Caller/context | Stored manager impact |
|---|---|
| Employee has active reporting line | Reporting-line manager is stored |
| Manager assigns and no reporting line exists | Assigning manager is stored as fallback |
| HR/Admin assigns and no reporting line exists | `manager` remains null |

Impact:

- HR/Admin can assign goals without becoming the employee's manager.
- Later manager-only operations may fail for goal sets with null manager unless HR/Admin performs them or reporting line is later available.

### Approval and revision

Approval and revision allow:

- HR/Admin.
- The goal-set manager.
- The employee's active direct reporting-line manager.

Impact:

- A manager can approve/revise only when they are linked to the employee through goal set or current reporting line.
- A route-accessible manager still cannot approve/revise arbitrary employees.

### Revert

Revert behavior:

| Goal status | Access impact |
|---|---|
| DRAFT | No-op response |
| APPROVED | Manager/HR/Admin can revert through controller role gate |
| LOCKED | Only HR/Admin can revert |
| ARCHIVED | Blocked |

Impact:

- Frontend generally hides locked edit controls, but backend has a special HR/Admin override for locked revert.

### Progress update

Backend allows:

| Item type | Who can update |
|---|---|
| Non-compliance item | Employee owner only |
| Compliance item | Goal-set manager, HR, or ADMIN |

Goal set must be `APPROVED`.

Impact:

- Frontend employee UPDATE being gated by `KPI_CREATE` can prevent a valid backend operation.
- Backend does not rely on `KPI_CREATE` or `KPI_APPROVE` for progress updates; it uses ownership, compliance flag, and role/manager relationship.

### Score calculation

Controller allows MANAGER or HR. Service allows:

- HR/Admin as privileged in service logic, but controller currently allows HR and MANAGER only.
- Manager only when they are the goal-set manager.

Impact:

- ADMIN is allowed by service logic but blocked by controller for `/calculate-score`.
- Frontend uses `isPrivileged = manager || admin || HR`, so Admin may see Calculate/Recalculate Score but receive backend 403 at the controller.

### KPI history

`KpiHistoryServiceImpl` validates:

- Employee can view own history.
- HR/Admin can view any history.
- Direct reporting-line manager can view direct reports.

Impact:

- History is better scoped than several direct goal-set read endpoints.
- Direct URL access to `/kpi/history/:employeeId` is authenticated-only on frontend, but backend service correctly enforces record access.

---

## Read Endpoint Exposure Impact

Some KPI read endpoints have broad controller access and limited/no service-level subject checks:

| Endpoint | Current protection | Impact |
|---|---|---|
| `GET /kpi/goal-set/employee/{employeeId}?cycleId=` | No `@PreAuthorize`; service does not validate self/manager/HR | Any authenticated caller may be able to request another employee's current goal set if they know the employee id. |
| `GET /kpi/goal-set/{id}` | No `@PreAuthorize`; service does not validate ownership | Any authenticated caller may be able to fetch a goal set by id. |
| `GET /kpi/goal-set/employee/all/{employeeId}` | No `@PreAuthorize`; service does not validate ownership | Broader history read risk than `/kpi-history/employee/{employeeId}`, which is protected in service. |
| `GET /kpi/library`, `/kpi/library/all`, `/kpi/library/{id}`, `/kpi/library/history/{positionId}` | Public to authenticated users | Likely acceptable if KPI templates are non-sensitive, but this should be a deliberate decision. |
| `GET /kpi/progress/history?employeeId=` | No `@PreAuthorize`; service does not validate ownership | Recent progress for another employee may be readable by id. |

Recommended backend direction:

- Apply the same owner/HR/Admin/direct-manager access check used by `KpiHistoryServiceImpl` to goal-set and progress read endpoints.
- Or explicitly annotate and document that all authenticated users may read these resources if that is intentional.

---

## Permission vs Role Mismatch Matrix

| Area | Frontend gate | Backend gate | Impact |
|---|---|---|---|
| Library management | HR/Admin route + `KPI_LIBRARY_MANAGE` UI | HR/Admin role | HR/Admin without permission can access route but actions hidden; direct API still works by role. |
| Goal management route | MANAGER/HR/Admin role | Department/team APIs role-gated | No named permission required for route access. |
| Goal assignment/edit | Role route + `KPI_CREATE` UI | MANAGER/HR/Admin role | Manager without permission cannot use UI, but API may allow. |
| Approve/revert/lock/verify | `KPI_APPROVE` UI | MANAGER/HR/Admin plus service checks | UI permission may be stricter than backend. |
| Employee progress update | `KPI_CREATE` UI | Employee owner for non-compliance | UI likely too strict or wrong permission. |
| Score calculation | Role-only UI | MANAGER/HR controller; service also considers ADMIN | Admin UI/backend mismatch. |
| Team dashboard | Route role; sidebar `KPI_VIEW_TEAM` | Controller MANAGER only | HR/Admin frontend may call team goal-set API through manager endpoint and get blocked unless using alternate department data. |
| Category page | HR/Admin route; sidebar `KPI_LIBRARY_MANAGE` | Create/update HR/Admin, delete ADMIN | HR can see page and create/update but delete will fail backend. |

---

## Practical Impact by User Type

### Employee

Expected:

- View own dashboard/history if granted `KPI_VIEW_OWN`.
- Update own approved non-compliance KPI progress.

Risks:

- UI progress update currently requires `KPI_CREATE`, so ordinary employees may not see UPDATE even though backend allows it.
- Direct goal-set read endpoints may expose other employees' goal sets if not scoped.

### Manager

Expected:

- View team pages if role route permits and sidebar permission exists.
- Assign/edit/approve/revise direct reports or assigned goal sets.
- Verify compliance items.
- Calculate scores for assigned goal sets.

Risks:

- Missing `KPI_CREATE` or `KPI_APPROVE` hides UI actions even when backend role/service checks would allow them.
- Direct API calls can bypass missing named frontend permissions if manager role is enough.

### HR

Expected:

- Manage libraries/categories.
- Assign, approve, revise, view department/all goal sets.
- Calculate scores.

Risks:

- If HR lacks `KPI_LIBRARY_MANAGE`, route still allows library page but action buttons are hidden.
- HR can assign goal sets with null manager when no reporting line exists; later manager-only actions may require HR/Admin.

### Admin

Expected:

- Manage library/category setup.
- View department/all goals.
- Assign/approve/revise through admin role.

Risks:

- Admin sees score calculation in frontend because `isPrivileged` includes Admin, but backend controller only allows MANAGER and HR for score calculate/get.
- Category delete is admin-only, matching backend, but route/sidebar wording should make this clear.

---

## Recommendations

1. Decide the source of truth:
   - If named permissions are intended to be authoritative, update KPI backend `@PreAuthorize` checks to use permissions, for example `hasAuthority('KPI_CREATE')`.
   - If roles are authoritative, simplify frontend gates to match roles and use named permissions only for navigation personalization.

2. Fix employee progress UI gate:
   - Replace `KPI_CREATE` around employee UPDATE with `KPI_VIEW_OWN` or a dedicated permission such as `KPI_PROGRESS_UPDATE`.
   - Keep backend ownership/compliance checks.

3. Align score calculation:
   - Either allow ADMIN in `@PreAuthorize("hasAnyRole('MANAGER','HR','ADMIN')")`, or hide score calculation for Admin in `GoalDetail`.

4. Protect read endpoints:
   - Add service-level access validation to `getGoalSetByEmployee`, `getGoalSetById`, `getEmployeeGoalSets`, and `getRecentProgress`.
   - Reuse a shared helper equivalent to `KpiHistoryServiceImpl.validateAccess`.

5. Align route and sidebar permission design:
   - `/kpi/manage` is shown by `KPI_LIBRARY_MANAGE`, but functionally it is goal assignment. Consider `KPI_CREATE` or `KPI_VIEW_ALL`.
   - `/kpi/categories` is shown by `KPI_LIBRARY_MANAGE`; that is reasonable, but delete behavior should be admin-only in UI.

6. Add explicit tests:
   - Employee cannot fetch another employee's goal set or progress history.
   - Manager cannot approve/revise non-direct-report goals.
   - HR/Admin can view and assign broadly.
   - Admin score calculation behavior matches the chosen policy.
   - Employee without `KPI_CREATE` can still update own approved KPI progress if that is the intended product behavior.

---

## Summary

The KPI module currently has strong role-based protection for most write operations, with additional relationship checks for approval, revision, scoring, progress updates, and history. The main weakness is consistency:

- Frontend uses named permissions to hide/show actions.
- Backend mostly uses roles and relationship checks.
- Several read endpoints are broader than the history endpoint and should be scoped.
- A few UX/backend mismatches can produce either hidden valid actions or visible actions that fail with 403.

The safest direction is to centralize KPI access rules in backend services, then make frontend permissions mirror those rules for usability rather than security.
