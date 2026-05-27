KPI Goals Lifecycle — Gap & Weakness Analysis
Current Lifecycle Coverage

DRAFT ──Save Draft──▶ DRAFT
DRAFT ──Approve──▶ APPROVED
APPROVED ──Revert──▶ DRAFT
APPROVED ──Lock──▶ LOCKED
APPROVED/LOCKED ──Calculate Score──▶ (no UI state change)
DRAFT/overwrite ──▶ ARCHIVED
The LOCKED → scored end is the weakest part of the loop. Once calculateScores fires, the UI has no post-score state — the stepper still shows LOCKED, nothing confirms to the user that the cycle is done.

Critical Gaps (break the flow)
1. No post-score state in the UI
After calculateScores succeeds, GoalDetail stepper still shows DRAFT → APPROVED → LOCKED. There is no "SCORED" step, no score badge, and no final score display on the page. The user cannot tell whether scoring worked or what the result was.

Fix: Add a 4th stepper step (SCORED). After the mutation resolves, refetch and display the KpiFinalScore value — weighted score and achievement % — prominently in a result card.

2. Lock button missing from GoalDetail
The docs say there's a Lock button on GoalDetail (APPROVED → LOCKED), but the actual file only shows Approve, Revert, and Calculate Score. There is no explicit UI path from APPROVED to LOCKED. Users cannot lock a goal set without some other mechanism, meaning goals can be scored while still in APPROVED state, bypassing the intended lifecycle stage.

Fix: Add the Lock button in GoalDetail for Manager/HR/Admin when status is APPROVED. Disable Calculate Score unless status is LOCKED (match backend enforcement).

3. Compliance verification has no completion signal
GoalDetail shows a VERIFY button for compliance items, which calls the progress update flow. But after verification, the item has no visual distinction from a non-compliance item that hit 100% normally. There's no "Verified by [name]" label, no locked state on the item, and no enforcement that all compliance items must be verified before the goal set can be locked/scored.

Fix: Add a verifiedBy / verifiedAt display on compliance item rows after VERIFY is submitted. Block Lock action if any compliance item has actualValue === 0 and isCompliance === true.

4. Revert-to-draft has no consequence warning
GoalAssignmentWorkspace shows a window.confirm before reverting, but the dialog text does not mention that employees are notified with a KPI_REJECTED notification, that existing progress history stays intact, or that the manager must re-approve from scratch. Users revert without understanding the downstream impact.

Fix: Replace the bare window.confirm with a styled confirmation modal that lists the consequences (notification sent to employee, goals become editable, re-approval required).

Significant Weaknesses (degrade UX / data integrity)
5. isModified guard on Save Draft is the only protection against stale data
GoalAssignmentWorkspace uses a local localItems array. If a second user (e.g., another manager or HR) edits the same goal set and saves, the first user's stale local state will silently overwrite it on the next Save Draft. There is no ETag, version check, or last-modified comparison.

Fix: Include goalSet.version in the bulk-update payload and have the backend reject the update if the version doesn't match (optimistic locking). Surface a "Goal set was modified by someone else — please reload" toast if the API returns a conflict.

6. Error handling is bare across all mutation calls

handleApprove in GoalAssignmentWorkspace has an empty catch {}.
ProgressUpdateModal and KpiRevisionModal use alert() with the raw API error string.
BulkAssignModal shows a single alert() for any failure, including partial failures where some employees succeeded and others failed.
The backend returns structured ApiResponse<T> with message and error fields — these are already being caught in some places (see KpiLibraryEntry) but ignored in the goal lifecycle components.

Fix: Standardise error handling: use toast.error(err?.data?.message || 'Operation failed') everywhere (matching KpiLibraryEntry). For bulk assign, show a per-employee result table even on partial failure instead of a single alert.

7. ARCHIVED status has no UI treatment
When a goal set is overwritten via assignment with overwriteExisting=true, the old set becomes ARCHIVED. However, none of the status badge maps in GoalAssignmentWorkspace, GoalDetail, or GoalManagement render a style for ARCHIVED. It will render as an unstyled empty string or throw a key miss.

Fix: Add ARCHIVED to every STATUS_STYLE / STATUS_LABEL map with a neutral grey badge. In EmployeeKpiHistory, archived sets should be clearly marked as superseded.

8. Audit log is invisible to employees
KpiAuditLogModal is only shown when isManager is true in GoalDetail. Employees cannot see who approved their goals, when they were locked, or what was revised — even though that information directly affects their performance record.

Fix: Show a read-only audit log to the employee (the goal-set owner). Gate write actions (REVISE, LOCK, etc.) to manager/HR, but not the read-only history view.

9. Role check inconsistency across components

GoalDetail checks user?.roles.includes('MANAGER') directly.
GoalAssignmentWorkspace uses isAdmin / isHR booleans from useAuth.
TeamKpiDashboard uses isAdminOrHr composite flag.
KpiGoalCard / ProgressUpdateModal do no role check at all before showing the VERIFY button.
This means the same operation can be either allowed or blocked depending on which component renders it, and a refactor of useAuth would only partially propagate.

Fix: Centralise all role gates in useAuth (e.g., canApproveGoals, canVerifyCompliance, canLockGoals) and replace all inline roles.includes() calls with those booleans.

10. Progress calculation in TeamKpiDashboard silently divides by zero
The team progress formula divides weightedSum / totalWeight without guarding against totalWeight === 0. For employees with no goal items, this produces NaN which renders as an empty progress bar with no warning.

Fix: Add const progress = totalWeight > 0 ? Math.floor(weightedSum / totalWeight) : 0; and show a "No goals assigned" state instead of a 0% bar.

Minor Issues (polish / completeness)
Issue	Location	Fix
KpiHub shows hardcoded "Next review in 12 days"	KpiHub.tsx	Derive from activeCycle.endDate
No loading skeleton for GoalDetail items table	GoalDetail.tsx	Add row-level skeleton while goalLoading is true
Delete goal item gives generic toast when blocked by existing progress	GoalAssignmentWorkspace.tsx	Show "This item has progress records and cannot be deleted. Use Revise instead."
BulkAssignModal has no confirmation before overwriting DRAFT goals	BulkAssignModal.tsx	Add a "X employees have existing DRAFT goals that will be replaced" warning step
EmployeeKpiHistory has no empty state	EmployeeKpiHistory.tsx	Add "No KPI history for previous cycles" message when list is empty
Priority Order for Fixes
Priority	Item	Reason
P0	Add Lock button to GoalDetail	Without it, APPROVED → LOCKED transition is orphaned
P0	Post-score state UI (SCORED step + score display)	Lifecycle has no visible end state
P1	Compliance verification completion guard	Compliance items can be "verified" with no persistent indicator
P1	Standardise error handling on all mutations	Silent failures lose data and confuse users
P1	Add ARCHIVED to all status badge maps	Will render broken UI today when archiving occurs
P2	Employee audit log read access	Transparency and trust issue
P2	Centralise role checks in useAuth	Security and maintainability
P3	totalWeight === 0 guard in team dashboard	Data quality / display bug
P3	Revert confirmation modal with consequences	UX clarity
The two P0 items (Lock button and post-score state) are structural — every other weakness is visible but manageable. The Lock button gap in particular means the backend's APPROVED → LOCKED → SCORED flow cannot be driven from GoalDetail as designed.