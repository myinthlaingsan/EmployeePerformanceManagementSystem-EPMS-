# KPI Goals Frontend — Full Fix Plan

> Branch: `design_modified`  
> Date: 2026-05-19  
> Scope: Goals lifecycle fixes only (not library/template layer)

---

## Approach

Work in priority order. Each fix is self-contained — complete one before starting the next.  
Every code block shows the **exact change** needed (old → new). File paths are relative to `epms_frontend/src/`.

---

## Fix Index

| # | Priority | Title | Files |
|---|---|---|---|
| F1 | P0 | Add `lockGoalSet` mutation to kpiApi | `services/kpiApi.ts` |
| F2 | P0 | Add Lock + Revert buttons to GoalDetail | `pages/kpi/GoalDetail.tsx` |
| F3 | P0 | Add SCORED stepper step + final score card | `pages/kpi/GoalDetail.tsx` |
| F4 | P0 | Fix `calculateScores` tag invalidation | `services/kpiApi.ts` |
| F5 | P1 | Add ARCHIVED to all STATUS_STYLE maps | `pages/kpi/GoalDetail.tsx`, `pages/kpi/GoalManagement.tsx` |
| F6 | P1 | Add `getFinalScore` query to kpiApi + kpiTypes | `services/kpiApi.ts`, `features/kpi/kpiTypes.ts` |
| F7 | P1 | Open audit log to employees (goal-set owner) | `pages/kpi/GoalDetail.tsx` |
| F8 | P1 | Centralise role checks — use `useAuth` booleans | `pages/kpi/GoalDetail.tsx` |
| F9 | P1 | Fix GoalManagement ARCHIVED crash | `pages/kpi/GoalManagement.tsx` |
| F10 | P2 | Add `approvedAt`, `version`, `lockedAt` to GoalSetResponse | `features/kpi/kpiTypes.ts` |
| F11 | P2 | Replace revert `window.confirm` with consequence modal | `pages/kpi/GoalDetail.tsx` |
| F12 | P2 | Compliance post-verify indicator | `pages/kpi/GoalDetail.tsx` |
| F13 | P2 | Fix Calculate Score — disable until LOCKED | `pages/kpi/GoalDetail.tsx` |

---

## F1 — Add `lockGoalSet` mutation to kpiApi

**File:** `services/kpiApi.ts`  
**Why:** `POST /kpi/goal-set/:id/lock` exists in the backend but has no RTK Query hook. The entire APPROVED → LOCKED transition is unreachable.

**Change — add after the `revertGoalSet` endpoint (around line 207):**

```ts
// ==================== Lock ====================
lockGoalSet: builder.mutation<ApiResponse<GoalSetResponse>, number>({
  query: (id) => ({
    url: `/kpi/goal-set/${id}/lock`,
    method: 'POST',
  }),
  invalidatesTags: ['GoalSet'],
}),
```

**Add to the exports at the bottom:**

```ts
// existing exports ...
useLockGoalSetMutation,
// add this line alongside useRevertGoalSetMutation
```

---

## F2 — Add Lock + Revert buttons to GoalDetail

**File:** `pages/kpi/GoalDetail.tsx`

### 2a — Add missing imports (lines 6–8)

```ts
// BEFORE
import {
  useGetGoalSetByEmployeeQuery,
  useApproveGoalSetMutation,
  useCalculateScoresMutation
} from '../../services/kpiApi';

// AFTER
import {
  useGetGoalSetByEmployeeQuery,
  useApproveGoalSetMutation,
  useRevertGoalSetMutation,
  useLockGoalSetMutation,
  useCalculateScoresMutation
} from '../../services/kpiApi';
```

### 2b — Instantiate new mutations (after line 41)

```ts
// BEFORE
const [approveGoal] = useApproveGoalSetMutation();
const [calculateScores] = useCalculateScoresMutation();

// AFTER
const [approveGoal]     = useApproveGoalSetMutation();
const [revertGoal]      = useRevertGoalSetMutation();
const [lockGoal]        = useLockGoalSetMutation();
const [calculateScores] = useCalculateScoresMutation();
```

### 2c — Add handler functions (after handleApprove, before handleCalculate)

```ts
const handleRevert = async () => {
  if (!goalSet) return;
  setShowRevertConfirm(true);   // handled in F11 — for now use a simple guard
};

const handleLock = async () => {
  if (!goalSet) return;
  const ok = window.confirm(
    `Lock "${goalSet.employeeName}'s" goals for this cycle?\n\nOnce locked, no more progress updates can be submitted.`
  );
  if (!ok) return;
  try {
    await lockGoal(goalSet.id).unwrap();
    toast.success('Goal set locked.');
  } catch (err: any) {
    toast.error(err?.data?.message || 'Failed to lock goal set');
  }
};
```

> Replace the existing `handleRevert` placeholder with the full version when F11 is done.

### 2d — Add state for revert confirmation modal

```ts
// near the other useState declarations
const [showRevertConfirm, setShowRevertConfirm] = useState(false);
```

### 2e — Add Lock and Revert buttons to the action toolbar (lines 106–126)

```tsx
{/* BEFORE — only Approve and Calculate Score */}
{isManager && (goalSet.status === 'DRAFT' || goalSet.status === 'APPROVED') && (
  <>
    <button onClick={() => navigate(`/kpi/assign/${employeeId}?cycleId=${effectiveCycleId}`)} ...>
      Modify Goals
    </button>
    {goalSet.status === 'DRAFT' && (
      <button onClick={handleApprove} ...>Approve Goals</button>
    )}
    {goalSet.status === 'APPROVED' && (
      <button onClick={handleCalculate} ...>Calculate Score</button>
    )}
  </>
)}

{/* AFTER — Approve, Revert, Lock, Calculate Score (all gated correctly) */}
{isManager && goalSet.status !== 'ARCHIVED' && (
  <>
    {(goalSet.status === 'DRAFT' || goalSet.status === 'APPROVED') && (
      <button
        onClick={() => navigate(`/kpi/assign/${employeeId}?cycleId=${effectiveCycleId}`)}
        style={{ background: '#111827', color: '#FFFFFF', borderRadius: 8, padding: '7px 12px', fontSize: 13, fontWeight: 500, border: 'none' }}>
        Modify Goals
      </button>
    )}

    {goalSet.status === 'DRAFT' && (
      <button onClick={handleApprove}
        style={{ background: '#EAF3DE', color: '#27500A', border: '0.5px solid #B8DCA0', borderRadius: 8, padding: '7px 12px', fontSize: 13, fontWeight: 500 }}>
        Approve Goals
      </button>
    )}

    {goalSet.status === 'APPROVED' && (
      <button onClick={() => setShowRevertConfirm(true)}
        style={{ background: '#FEF3C7', color: '#92400E', border: '0.5px solid #FDE68A', borderRadius: 8, padding: '7px 12px', fontSize: 13, fontWeight: 500 }}>
        Revert to Draft
      </button>
    )}

    {goalSet.status === 'APPROVED' && (
      <button onClick={handleLock}
        style={{ background: '#F1EFE8', color: '#444441', border: '0.5px solid #DDDBD2', borderRadius: 8, padding: '7px 12px', fontSize: 13, fontWeight: 500 }}>
        Lock Goals
      </button>
    )}

    {goalSet.status === 'LOCKED' && (
      <button onClick={handleCalculate}
        style={{ background: '#EEF3FD', color: '#0C447C', border: '0.5px solid #B5D4F4', borderRadius: 8, padding: '7px 12px', fontSize: 13, fontWeight: 500 }}>
        Calculate Score
      </button>
    )}
  </>
)}
```

> Note: Calculate Score is now only shown when status is `LOCKED` (see also F13).

---

## F3 — Add SCORED stepper step + final score card

**File:** `pages/kpi/GoalDetail.tsx`

### 3a — Extend the STEPS array (lines 22–26)

```ts
// BEFORE — 3 steps
const STEPS = [
  { id: 'DRAFT',    label: 'Draft',    icon: Edit3 },
  { id: 'APPROVED', label: 'Approved', icon: CheckCircle2 },
  { id: 'LOCKED',   label: 'Locked',   icon: Lock },
];

// AFTER — 4 steps
const STEPS = [
  { id: 'DRAFT',    label: 'Draft',    icon: Edit3 },
  { id: 'APPROVED', label: 'Approved', icon: CheckCircle2 },
  { id: 'LOCKED',   label: 'Locked',   icon: Lock },
  { id: 'SCORED',   label: 'Scored',   icon: Award },
];
```

> `Award` is already imported from lucide-react (line 14).  
> `SCORED` is a synthetic UI step — the goal set status stays `LOCKED` after scoring. Treat the step as active when `finalScore` is not null (see F6).

### 3b — Compute stepper index accounting for scored state

```ts
// Replace the single currentStepIndex line with:
const isScoredState = !!finalScore;   // finalScore from F6 query
const currentStepIndex = isScoredState
  ? 3   // SCORED step
  : STEPS.findIndex(s => s.id === goalSet.status);
```

### 3c — Add final score result card below the summary cards section

Insert after the `{/* Summary cards */}` block:

```tsx
{/* Final Score Card — visible once score is calculated */}
{isScoredState && finalScore && (
  <div style={{
    background: 'linear-gradient(135deg, #EAF3DE 0%, #FFFFFF 100%)',
    border: '0.5px solid #B8DCA0',
    borderRadius: 12,
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  }}>
    <div>
      <p style={{ fontSize: 10, fontWeight: 500, color: '#27500A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
        Final Score — Cycle {goalSet.appraisalCycleId}
      </p>
      <p style={{ fontSize: 28, fontWeight: 600, color: '#27500A', margin: 0 }}>
        {finalScore.weightedScore.toFixed(1)}
        <span style={{ fontSize: 14, fontWeight: 400, color: '#5A7A3A', marginLeft: 4 }}>/ 100</span>
      </p>
      {finalScore.totalAchievementPercent !== undefined && (
        <p style={{ fontSize: 12, color: '#5A7A3A', marginTop: 2 }}>
          Achievement: {finalScore.totalAchievementPercent.toFixed(1)}%
        </p>
      )}
    </div>
    <div style={{ textAlign: 'right' }}>
      <Award size={32} color="#27500A" strokeWidth={1.5} />
      <p style={{ fontSize: 10, color: '#9EA3B0', marginTop: 6 }}>
        Calculated {new Date(finalScore.calculatedAt).toLocaleDateString()}
      </p>
    </div>
  </div>
)}
```

---

## F4 — Fix `calculateScores` tag invalidation

**File:** `services/kpiApi.ts` (around line 264)

```ts
// BEFORE
calculateScores: builder.mutation<...>({
  query: ...,
  invalidatesTags: ['Score'],
}),

// AFTER
calculateScores: builder.mutation<...>({
  query: ...,
  invalidatesTags: ['Score', 'GoalSet'],
}),
```

**Why:** After scoring, GoalDetail's `useGetGoalSetByEmployeeQuery` cache won't invalidate and the page won't refetch to show updated state. Adding `'GoalSet'` forces a refetch.

---

## F5 — Add ARCHIVED to all STATUS_STYLE maps

### 5a — GoalDetail.tsx (lines 16–20)

```ts
// BEFORE
const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  APPROVED: { bg: '#EAF3DE', text: '#27500A', border: '#B8DCA0' },
  LOCKED:   { bg: '#F1EFE8', text: '#444441', border: '#DDDBD2' },
  DRAFT:    { bg: '#FAEEDA', text: '#633806', border: '#F0D4A4' },
};

// AFTER
const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  APPROVED: { bg: '#EAF3DE', text: '#27500A', border: '#B8DCA0' },
  LOCKED:   { bg: '#F1EFE8', text: '#444441', border: '#DDDBD2' },
  DRAFT:    { bg: '#FAEEDA', text: '#633806', border: '#F0D4A4' },
  ARCHIVED: { bg: '#F5F6F8', text: '#9EA3B0', border: '#E0E2E8' },
};
```

Also update the STEPS stepper to handle ARCHIVED gracefully (it's not a step in the flow, so index will be `-1`). Add this guard just before the stepper render:

```tsx
// If goal set is ARCHIVED, show a banner instead of the stepper
{goalSet.status === 'ARCHIVED' ? (
  <div style={{ background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 12, padding: '16px 24px', textAlign: 'center', color: '#9EA3B0', fontSize: 13 }}>
    This goal set has been archived and superseded by a newer assignment.
  </div>
) : (
  /* existing stepper JSX */
)}
```

### 5b — GoalManagement.tsx (lines 14–18)

```ts
// BEFORE
const STATUS_STYLE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  DRAFT:    { bg: '#EEF3FD', text: '#0C447C', border: '#B5D4F4', label: 'Drafting' },
  APPROVED: { bg: '#EAF3DE', text: '#27500A', border: '#B8DCA0', label: 'Approved' },
  LOCKED:   { bg: '#F1EFE8', text: '#444441', border: '#DDDBD2', label: 'Locked (Active)' },
};

// AFTER
const STATUS_STYLE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  DRAFT:    { bg: '#EEF3FD', text: '#0C447C', border: '#B5D4F4', label: 'Drafting' },
  APPROVED: { bg: '#EAF3DE', text: '#27500A', border: '#B8DCA0', label: 'Approved' },
  LOCKED:   { bg: '#F1EFE8', text: '#444441', border: '#DDDBD2', label: 'Locked (Active)' },
  ARCHIVED: { bg: '#F5F6F8', text: '#9EA3B0', border: '#E0E2E8', label: 'Archived' },
};
```

Also update the row click navigation guard (line 177) to not navigate for ARCHIVED rows:

```ts
// BEFORE
onClick={() => {
  if (status === 'APPROVED' || status === 'LOCKED') navigate(`/kpi/goals/${emp.id}?cycleId=${effectiveCycleId}`);
  else navigate(`/kpi/assign/${emp.id}`);
}}

// AFTER
onClick={() => {
  if (status === 'ARCHIVED') return;
  if (status === 'APPROVED' || status === 'LOCKED') navigate(`/kpi/goals/${emp.id}?cycleId=${effectiveCycleId}`);
  else navigate(`/kpi/assign/${emp.id}`);
}}
```

---

## F6 — Add `getFinalScore` query to kpiApi + kpiTypes

### 6a — Add response type to kpiTypes.ts

The `KpiScoreResponse` type already exists (line 171–179). No new type needed.

### 6b — Add query to kpiApi.ts (after `calculateScores` mutation)

```ts
getFinalScore: builder.query<ApiResponse<KpiScoreResponse>, { employeeId: number; cycleId: number }>({
  query: ({ employeeId, cycleId }) =>
    `/kpi/calculate-score?employeeId=${employeeId}&cycleId=${cycleId}`,
  providesTags: ['Score'],
}),
```

> **Note:** Confirm with the backend team that `GET /kpi/calculate-score?employeeId=&cycleId=` returns the existing score. If the endpoint is different (e.g., `GET /kpi/final-score`), update the URL. The typical REST pattern would be a `GET` on the same endpoint that `POST` writes to.

**Add to exports:**

```ts
useGetFinalScoreQuery,
```

### 6c — Use in GoalDetail.tsx

```ts
// Add this query after the existing goal set query
const { data: finalScoreResponse } = useGetFinalScoreQuery(
  { employeeId: parseInt(employeeId!), cycleId: effectiveCycleId },
  { skip: !goalSet || (goalSet.status !== 'LOCKED') }
);
const finalScore = finalScoreResponse?.data ?? null;
```

---

## F7 — Open audit log to employees (goal-set owner)

**File:** `pages/kpi/GoalDetail.tsx` (lines 99–105)

```tsx
// BEFORE — only managers see the audit log button
{isManager && (
  <button onClick={() => setShowAuditLog(true)} ...>
    <History size={14} /> Audit Log
  </button>
)}

// AFTER — owner (employee) can also open it in read-only mode
{(isManager || isOwner) && (
  <button onClick={() => setShowAuditLog(true)}
    style={{ background: '#F5F6F8', color: '#5A6070', border: '0.5px solid #E0E2E8', borderRadius: 8, padding: '7px 12px', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}
    className="hover:bg-gray-100 transition-colors">
    <History size={14} /> History
  </button>
)}
```

> The `KpiAuditLogModal` itself is already read-only — no changes needed inside the modal.

---

## F8 — Centralise role checks — use `useAuth` booleans

**File:** `pages/kpi/GoalDetail.tsx`

### 8a — Update the useAuth destructure (line 32)

```ts
// BEFORE
const { user, activeCycleId } = useAuth();

// AFTER
const { user, activeCycleId, isManager, isAdmin, isHR } = useAuth();
```

### 8b — Remove the inline role check (line 53)

```ts
// BEFORE
const isManager = user?.roles.includes('MANAGER') || user?.roles.includes('ADMIN') || user?.roles.includes('HR');

// AFTER
const isPrivileged = isManager || isAdmin || isHR;   // replaces the inline derivation
```

### 8c — Replace every `isManager` reference in the JSX with `isPrivileged`

Search for `isManager` in `GoalDetail.tsx` and replace with `isPrivileged`. There are 4 occurrences:
- line 99 (audit log button)
- line 106 (action toolbar gate)
- line 251 (VERIFY button)
- line 261 (REVISE button)

---

## F9 — Fix GoalManagement ARCHIVED runtime crash

Already covered by F5b. The root crash is `STATUS_STYLE[status]` returning `undefined` when `status === 'ARCHIVED'`, then `ss.bg` throwing. Adding `ARCHIVED` to the map in F5b resolves it.

Additionally, add a defensive fallback in the `getStatusBadge` function (line 88) for any unknown future status:

```ts
// BEFORE
const ss = STATUS_STYLE[status];
return (
  <span style={{ ... background: ss.bg ... }}>
    {ss.label}
  </span>
);

// AFTER
const ss = STATUS_STYLE[status] ?? { bg: '#F5F6F8', text: '#9EA3B0', border: '#E0E2E8', label: status };
return (
  <span style={{ ... background: ss.bg ... }}>
    {ss.label}
  </span>
);
```

---

## F10 — Add missing fields to GoalSetResponse

**File:** `features/kpi/kpiTypes.ts`

The `GoalSetResponse` interface (line 134) is missing several fields returned by the backend. Add them so the UI can use them without TypeScript casting:

```ts
// BEFORE
export interface GoalSetResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  managerId: number;
  managerName: string;
  appraisalCycleId: number;
  appraisalCycleName?: string;
  status: KpiGoalStatus;
  items: GoalItemResponse[];
}

// AFTER
export interface GoalSetResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  managerId: number;
  managerName: string;
  appraisalCycleId: number;
  appraisalCycleName?: string;
  status: KpiGoalStatus;
  version?: number;
  createdAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  lockedAt?: string;
  items: GoalItemResponse[];
}
```

Also add `verifiedAt` and `verifiedBy` to `GoalItemResponse` (line 105) for F12:

```ts
export interface GoalItemResponse {
  // ... existing fields ...
  verifiedAt?: string;
  verifiedBy?: string;
}
```

---

## F11 — Replace revert `window.confirm` with consequence modal

**File:** `pages/kpi/GoalDetail.tsx`

### 11a — Build an inline confirmation dialog (no new component file needed)

Add a simple confirmation overlay after the modals block (before the closing `</div>`):

```tsx
{showRevertConfirm && (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
  }}>
    <div style={{ background: '#FFFFFF', borderRadius: 16, padding: '28px 32px', maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
        Revert to Draft?
      </h3>
      <p style={{ fontSize: 13, color: '#5A6070', lineHeight: 1.6, marginBottom: 16 }}>
        This will:
      </p>
      <ul style={{ fontSize: 13, color: '#5A6070', lineHeight: 2, paddingLeft: 20, marginBottom: 20 }}>
        <li>Send a <strong>KPI_REJECTED</strong> notification to {goalSet?.employeeName}</li>
        <li>Make all goal items editable again</li>
        <li>Require re-approval before goals become active</li>
        <li>Existing progress history will be preserved</li>
      </ul>
      <div className="flex justify-end gap-3">
        <button onClick={() => setShowRevertConfirm(false)}
          style={{ background: '#F5F6F8', color: '#5A6070', border: '0.5px solid #E0E2E8', borderRadius: 8, padding: '8px 16px', fontSize: 13 }}>
          Cancel
        </button>
        <button onClick={async () => {
            setShowRevertConfirm(false);
            try {
              await revertGoal(goalSet!.id).unwrap();
              toast.success('Goal set reverted to draft.');
            } catch (err: any) {
              toast.error(err?.data?.message || 'Failed to revert goal set');
            }
          }}
          style={{ background: '#FEF3C7', color: '#92400E', border: '0.5px solid #FDE68A', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500 }}>
          Yes, Revert
        </button>
      </div>
    </div>
  </div>
)}
```

---

## F12 — Compliance post-verify indicator

**File:** `pages/kpi/GoalDetail.tsx`

After a compliance item is verified (VERIFY button clicked and progress submitted), the row should show who verified it and when, instead of showing the VERIFY button again.

### 12a — Update the compliance VERIFY button block (lines 250–258)

```tsx
{/* BEFORE */}
{isPrivileged && item.isCompliance && goalSet.status === 'APPROVED' && (
  <button onClick={() => { setSelectedItem(item); setShowProgressModal(true); }}
    style={{ background: '#FEF3C7', color: '#92400E', border: '0.5px solid #FDE68A', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 500 }}
    className="hover:bg-amber-200 transition">
    VERIFY
  </button>
)}

{/* AFTER */}
{isPrivileged && item.isCompliance && goalSet.status === 'APPROVED' && (
  item.verifiedAt ? (
    <div style={{ fontSize: 10, color: '#27500A', background: '#EAF3DE', border: '0.5px solid #B8DCA0', borderRadius: 6, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
      <ShieldCheck size={11} />
      Verified {item.verifiedBy ? `by ${item.verifiedBy}` : ''} {new Date(item.verifiedAt).toLocaleDateString()}
    </div>
  ) : (
    <button onClick={() => { setSelectedItem(item); setShowProgressModal(true); }}
      style={{ background: '#FEF3C7', color: '#92400E', border: '0.5px solid #FDE68A', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 500 }}
      className="hover:bg-amber-200 transition">
      VERIFY
    </button>
  )
)}
```

> This depends on F10 — `GoalItemResponse.verifiedAt` / `verifiedBy` fields being populated by the backend.  
> **Confirm with backend:** Does `PUT /kpi/progress` for compliance items set `verifiedAt` + `verifiedBy` on `KpiGoalItem`? If not, this can be approximated by checking `item.currentProgress > 0 && item.isCompliance`.

---

## F13 — Restrict Calculate Score to LOCKED status only

Already handled as part of **F2d** — the Calculate Score button is now only rendered when `goalSet.status === 'LOCKED'`.

**Why:** The backend allows scoring on APPROVED or LOCKED, but the intended lifecycle requires locking first. Restricting the UI prevents users from scoring an unfinished APPROVED set by mistake.

---

## Testing Checklist

After each fix, verify these scenarios manually:

### P0 Fixes (F1–F4)
- [ ] Navigate to `/kpi/goals/:employeeId` for an APPROVED goal set
- [ ] "Lock Goals" button appears → click it → toast confirms → stepper advances to LOCKED
- [ ] "Revert to Draft" button appears on APPROVED → consequence modal shows → confirm → status returns to DRAFT
- [ ] "Calculate Score" button only visible when status is LOCKED
- [ ] After calculating score → final score card appears with weighted score and achievement %
- [ ] Stepper shows 4th SCORED step as active after scoring

### P1 Fixes (F5–F9)
- [ ] Navigate to GoalManagement — an employee with ARCHIVED status shows a grey "Archived" badge, no crash
- [ ] Clicking an ARCHIVED row does nothing (no navigation)
- [ ] Employee (non-manager) can open the audit log on their own goal set
- [ ] No `user?.roles.includes(...)` calls remain in GoalDetail — all role checks use `isPrivileged`

### P2 Fixes (F10–F13)
- [ ] GoalSetResponse fields `approvedAt`, `version` are visible when logged in DevTools
- [ ] Revert confirmation modal lists all 4 consequences before executing
- [ ] Compliance items show "Verified by [name]" after VERIFY is submitted
- [ ] Calculate Score button is absent on APPROVED goal sets

---

## Notes on `kpiApi.ts` tag types

The `getActiveCycle` endpoint (line 250) uses `providesTags: ['Cycle']` but `'Cycle'` is likely not in the base `api` `tagTypes` array. Check `services/api.ts` and add `'Cycle'` to the tagTypes list if it is missing.

```ts
// In services/api.ts — find the tagTypes array and add 'Cycle' and 'Score' if absent:
tagTypes: ['Library', 'Category', 'GoalSet', 'Progress', 'Score', 'Cycle'],
```

---

## File-Change Summary

| File | Fixes Applied |
|---|---|
| `services/kpiApi.ts` | F1, F4, F6 |
| `services/api.ts` | Note — tagTypes |
| `features/kpi/kpiTypes.ts` | F10 |
| `pages/kpi/GoalDetail.tsx` | F2, F3, F5a, F7, F8, F11, F12, F13 |
| `pages/kpi/GoalManagement.tsx` | F5b, F9 |
