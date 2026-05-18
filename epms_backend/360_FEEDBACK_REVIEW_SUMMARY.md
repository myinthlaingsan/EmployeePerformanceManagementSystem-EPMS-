# 360° Feedback Module — Design Ideas, Code Review, and Coverage Analysis

> Working document for the EPMS backend 360° feedback feature.
> Covers: feature ideas, review of the existing implementation, and a check against standard 360° feedback principles (self / peer / subordinate / supervisor).

---

## Part 1 — Design Ideas for 360° Feedback

Concrete ideas to build on top of your existing entities (`AppraisalForm`, `FormCategory`, `Question`, `DepartmentFeedbackConfig`, `Feedback`, `FeedbackRequest`, `FeedbackResponse`, `FeedbackSummary`).

### 1.1 Evaluator selection & nomination workflow

`FeedbackRequest` assumes someone has already decided who evaluates whom. In practice 360° feedback lives or dies on *who* gets to give feedback. Consider adding a nomination phase:

- **Self-nomination** — the target employee proposes peers/subordinates from a directory.
- **Manager approval** — the direct manager approves/rejects/swaps nominees, enforcing the `DepartmentFeedbackConfig` min/max rules.
- **HR override** — HR/admin can force-add or remove evaluators (e.g., to ensure cross-functional peers for matrix reports).

A new entity like `EvaluatorNomination(targetUser, nominee, relationship, status, nominatedBy, approvedBy)` keeps this auditable. Only after approval do you generate `FeedbackRequest` rows. This also lets you cleanly enforce `allowCrossDepartment` from `DepartmentFeedbackConfig`.

### 1.2 Form routing per relationship

You have `AppraisalForm` + `FormType` and `AppraisalFormSet`, but nothing explicitly says *"this form is for peers, this one for self, this one for managers"* in a given cycle. Two clean options:

- Add `FeedbackRelationship targetRelationship` to `AppraisalForm` (simplest).
- Or add a join entity `FormSetAssignment(formSet, form, relationship)` so one form set bundles four/five forms for a cycle.

When you create `FeedbackRequest`, look up the right form by `(cycle, relationship)` instead of letting the caller pick.

### 1.3 Anonymity that actually holds up

`FeedbackRequest.isAnonymous` is a good start, but anonymity has to be enforced at the *read* layer, not just the write layer:

- Never expose `evaluator_id` in any report DTO when `isAnonymous = true` and `relationship` is Peer or Subordinate. Self and Manager are inherently identifiable, so `isAnonymous` should only be settable for Peer/Subordinate.
- **Suppression threshold** — if fewer than N (typically 3) responses exist for a relationship group, don't show the group's scores or comments separately. Otherwise a single peer's identity is trivially inferable.
- Store evaluator on `Feedback` for audit/compliance, but expose it only to HR/admin via a separate API path.

### 1.4 Question design — beyond 1–5 ratings

Your `Question` has `QuestionType` and `secondaryQuestionType`. Worth supporting explicitly:

- **Rating + required comment** — useful for low or high scores ("score ≤ 2 requires a comment").
- **Competency tagging** — add `competency_id` on `Question` so reports can aggregate by competency (Communication, Leadership, etc.) across forms.
- **Weighting** — a `weight` field on `Question` and/or `FormCategory` so not every question pulls equally into the average.
- **Open-ended only** — no score, for "What should this person start/stop/continue?" Your `FeedbackResponse.score` is already nullable-friendly.

### 1.5 Scoring & aggregation rules

`FeedbackSummary` already splits `managerScore / peerScore / subordinateScore / selfScore / finalScore`. The piece to formalize is *how* `finalScore` is derived:

```
finalScore = w_mgr * managerScore + w_peer * peerScore + w_sub * subordinateScore + w_self * selfScore
```

Store these weights per cycle or per job level. A `ScoringPolicy(cycle, jobLevel, managerWeight, peerWeight, subordinateWeight, selfWeight)` entity makes this configurable without code changes.

Edge cases to handle explicitly:

- Subordinate weight should drop to 0 (and other weights renormalize) when the employee has no direct reports.
- Below-threshold groups (see anonymity point) should be excluded from the weighted average, not zeroed.
- Self-score is often shown but *not* included in `finalScore` — make this a policy flag.

### 1.6 Request lifecycle & reminders

Your `FeedbackStatus` is good, but the request needs a few more fields to drive operations:

- `dueDate` on `FeedbackRequest` (or inherited from `AppraisalCycle`).
- `lastReminderSentAt` for nudging logic.
- A scheduled job that emails evaluators at T-7, T-2, T-0, and escalates to the manager after the deadline.
- A `startedAt` field for partial drafts so evaluators can save progress.

### 1.7 Consolidated report sections

A useful 360° report typically has:

- **Headline scorecard** — per-relationship average + final score, with prior cycle delta.
- **Self vs others gap analysis** — per competency, plot self-score vs the average of others. Big gaps are the most actionable insight in 360°.
- **Per-competency heatmap** — rows = competencies, columns = relationships, cells = average score.
- **Top strengths / development areas** — questions with the highest and lowest cross-relationship averages.
- **Verbatim comments** — grouped by relationship, anonymized, shuffled order so submission order doesn't leak identity.
- **Participation stats** — # requested vs # submitted, per relationship.

Model as a generated artifact tied to `FeedbackSummary`, regenerated when `isFinalized` flips to true.

### 1.8 Calibration & manager review step

Before `isFinalized = true`, most orgs want a manager/HR review pass:

- Manager sees the consolidated report and can add a written summary.
- HR can run *calibration sessions* across a department to normalize ratings.
- Add a `managerSummary` text field + `calibratedFinalScore` on `FeedbackSummary` to capture post-calibration adjustments without losing the raw `finalScore`.

### 1.9 Suggested schema additions

`EvaluatorNomination`, `ScoringPolicy`, `Competency` (+ FK on `Question`), `weight` on `Question`/`FormCategory`, `targetRelationship` on `AppraisalForm`, `dueDate`/`lastReminderSentAt`/`startedAt` on `FeedbackRequest`, `managerSummary`/`calibratedFinalScore` on `FeedbackSummary`, and an `anonymitySuppressionThreshold` setting per cycle.

---

## Part 2 — Code Review of the Existing `epms_backend` Implementation

Reviewed files include: `Feedback.java`, `FeedbackRequest.java`, `FeedbackResponse.java`, `FeedbackSummary.java`, `DepartmentFeedbackConfig.java`, `FeedbackSelectionServiceImpl.java`, `FeedbackSubmissionServiceImpl.java`, `FeedbackSummaryServiceImpl.java`, `FeedbackRequestServiceImpl.java`, `FeedbackFormServiceImpl.java`, `FeedbackReportServiceImpl.java`, `DepartmentFeedbackConfigServiceImpl.java`, plus the controllers in `controller/feedback360/`.

### 2.1 Critical bugs (data correctness)

#### Bug 1 — `FeedbackSummaryServiceImpl.generateSummary` deflates `finalScore` when a group is missing

```java
BigDecimal managerScore = calculateGroupAverage(grouped.get(FeedbackRelationship.MANAGER));
finalScore = finalScore.add(managerScore.multiply(new BigDecimal("0.4")));
finalScore = finalScore.add(peerScore.multiply(new BigDecimal("0.3")));
finalScore = finalScore.add(subScore.multiply(new BigDecimal("0.2")));
finalScore = finalScore.add(selfScore.multiply(new BigDecimal("0.1")));
```

`calculateGroupAverage` returns `BigDecimal.ZERO` for missing groups, which is then multiplied into the final, silently deflating it.

Example: an IC with no subordinates. Manager 80, peer 80, self 80, subordinate empty → finalScore = 0.4×80 + 0.3×80 + 0.2×0 + 0.1×80 = **64** (should be ~80).

**Fix** — only include groups that have feedback and renormalize weights:

```java
Map<FeedbackRelationship, BigDecimal> weights = Map.of(
    MANAGER, new BigDecimal("0.40"),
    PEER, new BigDecimal("0.30"),
    SUBORDINATE, new BigDecimal("0.20"),
    SELF, new BigDecimal("0.10")
);

Map<FeedbackRelationship, BigDecimal> scores = new EnumMap<>(FeedbackRelationship.class);
scores.put(MANAGER, averageOrNull(grouped.get(MANAGER)));
scores.put(PEER, averageOrNull(grouped.get(PEER)));
scores.put(SUBORDINATE, averageOrNull(grouped.get(SUBORDINATE)));
scores.put(SELF, averageOrNull(grouped.get(SELF)));

BigDecimal totalWeight = scores.entrySet().stream()
    .filter(e -> e.getValue() != null)
    .map(e -> weights.get(e.getKey()))
    .reduce(BigDecimal.ZERO, BigDecimal::add);

BigDecimal finalScore = scores.entrySet().stream()
    .filter(e -> e.getValue() != null)
    .map(e -> e.getValue().multiply(weights.get(e.getKey())))
    .reduce(BigDecimal.ZERO, BigDecimal::add)
    .divide(totalWeight, 2, RoundingMode.HALF_UP);
```

Most companies *do not* include self-score in `finalScore`. Make this a flag on `AppraisalCycle` or a `ScoringPolicy` entity rather than hardcoded 0.1.

#### Bug 2 — `FeedbackSubmissionServiceImpl.submitFeedback` has divide-by-zero and NPE risks

```java
int totalPoints = responses.stream().mapToInt(FeedbackResponse::getScore).sum();
int questionCount = responses.size();
BigDecimal averageScore = BigDecimal.valueOf(totalPoints)
    .divide(BigDecimal.valueOf(questionCount * 5), 4, RoundingMode.HALF_UP)
    .multiply(BigDecimal.valueOf(100));
```

- If `responses` is empty → `ArithmeticException` on divide-by-zero.
- If any score is null (comment-only questions) → `mapToInt` NPEs.

**Fix**:

```java
List<Integer> ratings = responses.stream()
    .map(FeedbackResponse::getScore)
    .filter(Objects::nonNull)
    .collect(Collectors.toList());

BigDecimal averageScore = ratings.isEmpty()
    ? null
    : BigDecimal.valueOf(ratings.stream().mapToInt(Integer::intValue).sum())
        .multiply(BigDecimal.valueOf(100))
        .divide(BigDecimal.valueOf(ratings.size() * 5L), 2, RoundingMode.HALF_UP);
```

Also: no validation that score is in 1–5; no enforcement of `Question.isRequired`. Add `@Min(1) @Max(5)` on the DTO and reject submissions missing required answers.

#### Bug 3 — `FeedbackReportServiceImpl` has the same NPE risk plus anonymity leaks

```java
Integer score = response.getScore();
// ...
totalOthersPoints += score;   // unboxes null
```

Filter null scores before aggregation.

Anonymity issues in the same method:

- Anonymity is hardcoded by relationship type (`PEER` and `SUBORDINATE` → "Anonymous"). But `FeedbackRequest.isAnonymous` is a per-request flag and should be honored. Use `feedback.getRequest().getIsAnonymous()`.
- `detailedComments` is built in iteration order. If only one peer submitted, that single comment is trivially attributable. Add a suppression threshold (≥3): if a relationship group has fewer than N submissions, hide its comments.
- Shuffle the comments list before returning, so submission order doesn't leak identity.
- The response only splits `selfScores` vs `scores` (others). You lose the manager/peer/subordinate breakdown that's the whole point of 360°.

#### Bug 4 — `submitFeedback` save order is fragile

```java
feedbackRepository.save(feedback);
responseRepository.saveAll(responses);
```

Responses are built before `feedback` is persisted, referencing the still-transient `feedback`. JPA tolerates this only because of flush ordering in the same transaction.

**Cleaner**: add `@OneToMany(mappedBy = "feedback", cascade = CascadeType.ALL, orphanRemoval = true)` on `Feedback.responses`, build the list on `feedback`, and save `feedback` once.

Also, submission does not invalidate the cached `FeedbackSummary`. Either (a) recompute the summary asynchronously, or (b) mark the summary stale so the report endpoint knows to recompute lazily.

### 2.2 Significant design issues

#### Issue 5 — One form for all relationships

```java
AppraisalForm defaultForm = cycle.getForms().stream()
    .filter(f -> f.getFormType() == FormType.FEEDBACK)
    .findFirst()
    .orElse(null);
```

A single FEEDBACK form is assigned to manager, peer, subordinate, and self requests. The whole reason `AppraisalForm` has `FormType` and `AppraisalFormSet` is to support *different* questions per relationship.

**Fix** — either add `FeedbackRelationship targetRelationship` to `AppraisalForm`, or use FormType values like `FEEDBACK_MANAGER`, `FEEDBACK_PEER`, `FEEDBACK_SUBORDINATE`, `FEEDBACK_SELF` and look up by `(cycle, relationship)`.

#### Issue 6 — Two parallel selection flows that don't agree

You have both `FeedbackSelectionService` (`suggestEvaluators` + `confirmEvaluators`) and `FeedbackRequestService` (`generate360FeedbackRequests`). They duplicate peer-finding, rotation, and workload control — and will drift.

Pick one:

- If selection is **manual** (manager nominates) — keep `FeedbackSelectionService`, have it call into a shared "create request" helper that enforces `DepartmentFeedbackConfig`, workload, and rotation.
- If selection is **automatic** — delete `FeedbackSelectionService` and expose `generate360FeedbackRequests` + a manual override endpoint.

`confirmEvaluators` currently doesn't validate the relationship, doesn't honor per-department config, and hardcodes `isAnonymous = true` even for manager/self entries (wrong).

#### Issue 7 — `FeedbackRequest.isAnonymous` default is wrong

```java
@Builder.Default
private Boolean isAnonymous = true;
```

Manager and self are inherently identifiable. If someone forgets to set the flag when creating a manager request, you'll later expose the manager incorrectly. Either:

- Compute `isAnonymous` from `relationship` (PEER/SUBORDINATE → true, MANAGER/SELF → false) and don't store it, or
- Validate in a `@PrePersist` hook.

#### Issue 8 — `findSubordinatesByDepartment` only looks one level down

```java
.filter(e -> getLevelRank(e) == (targetRank + 1))
```

A manager at rank 4 with both rank-5 and rank-6 subordinates only sees rank-5.

**Fix** — use `ReportingLineRepository.findAllByManagerAndIsActiveTrue(target)` which is the source of truth for direct reports.

#### Issue 9 — Missing operational fields on `FeedbackRequest`

- `dueDate` — required to drive reminders/escalation.
- `startedAt` — to support draft saving (no draft currently — submit-or-nothing).
- `lastReminderSentAt` — for the reminder job.
- `FeedbackStatus` declares `PENDING`, `SUBMITTED`, `COMPLETED` but only PENDING and COMPLETED are used. Add `IN_PROGRESS` for drafts; drop `SUBMITTED` if vestigial.

#### Issue 10 — `generateAllSummaries(cycleId)` iterates every employee

```java
List<Employee> employees = employeeRepository.findAll();
for (Employee e : employees) {
    generateSummary(e.getId(), cycleId);
}
```

Creates an empty zero-summary for every employee, even those with no feedback. Filter to employees with at least one Feedback row in this cycle. Same N+1 issue in `getSummariesByCycle`.

### 2.3 Smaller things

- `FeedbackRelationship` has both `MANAGER`, `DIRECT_MANAGER`, and `SUPERIOR`. Pick one canonical term per role.
- `RuntimeException` thrown in selection and submission services — use typed exceptions (`NotFoundException`, etc.) for consistent HTTP mapping.
- `deleteFeedback` resets the request to PENDING but doesn't recompute the summary — orphaned data.
- `Collections.shuffle(...)` uses a non-seeded `Random`. Consider seeding with `cycleId + targetId` for reproducible regeneration.
- `Question.isRequired` is never enforced at submission.
- `getFeedbackByRequest`, `getMySubmittedFeedbacks`, `getFeedbackReceivedByEmployee` lack authorization checks.
- `existsByTargetUserIdAndEvaluatorIdAndCycleCycleId` is called in a loop — preload existing `(target, evaluator)` pairs into a `Set` once.

### 2.4 What to fix first

1. **`generateSummary` finalScore** — missing groups deflate scores. Renormalize weights over present groups.
2. **NPE / divide-by-zero** in `submitFeedback` and `getFeedbackSummary` when scores are null or responses are empty.
3. **Anonymity** — read `FeedbackRequest.isAnonymous` instead of hardcoding by relationship, add a suppression threshold (≥3), and shuffle comments.

After that: form-per-relationship (Issue 5) and consolidate selection flows (Issue 6).

---

## Part 3 — Coverage Against the Four 360° Feedback Principles

Mapping the implementation to the standard four feedback sources.

### 3.1 Self-assessment — supported

Mapped to `FeedbackRelationship.SELF`.

- `FeedbackRequestServiceImpl.generateRequestsForEmployee` creates a self-eval request for every target.
- `isAnonymous = false` correctly enforced.
- `FeedbackSummaryServiceImpl` produces a separate `selfScore`.
- `FeedbackReportServiceImpl` splits `selfScores` vs `othersScores`.

**Gap** — the *value* of self-assessment is the gap between how I see myself vs how others see me. Return a `selfVsOthersGap` per category in `FeedbackSummaryResponse`. Also, self-score is folded into `finalScore` at 10% — most 360° methodologies advise against this; self should be informational only.

### 3.2 Peer feedback — well supported

Mapped to `FeedbackRelationship.PEER`. The "counterbalance to manager" intent is well served:

- Multiple peer pools (`findPeersByDepartment`, `findPeersByTeam`, `findPeersGlobal`).
- `DepartmentFeedbackConfig` for min/max peers per department + level.
- Three-pass selection (rotated non-reciprocal → rotated reciprocal → non-rotated) prevents quid-pro-quo rating swaps.
- `isAnonymous = true` enforced.
- `peerScore` in `FeedbackSummary`.

**Gaps** — anonymity is leaky on the read side (hardcoded by relationship, no suppression threshold). No competency tagging on `Question`, so collaboration/team-spirit insights aren't surfaced.

### 3.3 Subordinate feedback — supported, one level deep only

Mapped to `FeedbackRelationship.SUBORDINATE`.

- `subordinateScore` in `FeedbackSummary`.
- Only managers (`maxSubs > 0` based on rank or `DepartmentFeedbackConfig`) receive subordinate feedback.
- Anonymous by default.

**Gaps** — `findSubordinatesByDepartment` filters `getLevelRank(e) == (targetRank + 1)`, so an L4 manager with both L5 and L6 reports only sees L5. Use `ReportingLineRepository.findAllByManagerAndIsActiveTrue(target)` instead. Also, every relationship gets the same form — leadership-specific questions ("Does your manager give clear direction?") need to live in a subordinate-only form.

### 3.4 Supervisor feedback — supported with a real bug

Mapped to `FeedbackRelationship.MANAGER` (and `SUPERIOR` for rank-4 department heads).

- `assignManager` finds the active reporting line and creates the request.
- `isAnonymous = false` (correct).
- `managerScore` in `FeedbackSummary`.
- For rank == 4, `EvaluatorRotationService.assignTopManagementEvaluator` picks an L01–L03 evaluator — labelled `SUPERIOR`.

**Bug** — `FeedbackSummaryServiceImpl.generateSummary` only groups by `MANAGER`:

```java
BigDecimal managerScore = calculateGroupAverage(grouped.get(FeedbackRelationship.MANAGER));
```

Feedback created as `SUPERIOR` (rank-4 department heads via rotation rule) is **silently dropped** from the summary. The same applies to `DIRECT_MANAGER`. Three enum values mean "supervisor" and only one is read.

**Fix** — treat MANAGER/DIRECT_MANAGER/SUPERIOR as a set:

```java
Set<FeedbackRelationship> supervisorRels = EnumSet.of(MANAGER, DIRECT_MANAGER, SUPERIOR);
List<Feedback> supervisorFeedbacks = grouped.entrySet().stream()
    .filter(e -> supervisorRels.contains(e.getKey()))
    .flatMap(e -> e.getValue().stream())
    .collect(Collectors.toList());
BigDecimal managerScore = calculateGroupAverage(supervisorFeedbacks);
```

Apply the same fix in `FeedbackReportServiceImpl` — its anonymity check only excludes PEER/SUBORDINATE, so SUPERIOR currently does expose the evaluator's name (verify this is intentional, since supervisor feedback is normally non-anonymous).

### 3.5 Coverage summary

| Principle | Implemented? | Main gap |
|---|---|---|
| Self-assessment | Yes | Folded into finalScore at 10%; no self-vs-others gap surfaced |
| Peer feedback | Yes | Anonymity hardcoded by relationship; no suppression threshold; no competency tagging |
| Subordinate feedback | Yes | Only direct level (rank+1); same generic form as peers |
| Supervisor feedback | Yes — with bug | `SUPERIOR` and `DIRECT_MANAGER` feedback never reaches `managerScore` in the summary |

The framework is in place. The **supervisor-summary bug** is the highest-impact fix — it drops the most consequential data source for the most senior population (department heads).

---

## Recommended Fix Order

1. Fix `FeedbackSummaryServiceImpl.generateSummary` — handle MANAGER/DIRECT_MANAGER/SUPERIOR as one group, and renormalize weights over present groups.
2. Fix NPE/divide-by-zero in `submitFeedback` and `getFeedbackSummary`.
3. Fix anonymity reads — honor `FeedbackRequest.isAnonymous`, add suppression threshold (≥3), shuffle comments.
4. Add `dueDate`, `startedAt`, `lastReminderSentAt` to `FeedbackRequest`; introduce `IN_PROGRESS` status for drafts.
5. Add `targetRelationship` to `AppraisalForm` so each relationship can have its own form.
6. Consolidate `FeedbackSelectionService` and `FeedbackRequestService` selection logic.
7. Add `Competency` entity + FK on `Question`; surface per-competency reporting.
8. Add `ScoringPolicy` (per cycle or job level) to remove hardcoded weights.
9. Replace `findSubordinatesByDepartment`'s level-rank guess with `ReportingLineRepository`.
10. Add authorization checks on the read endpoints.
