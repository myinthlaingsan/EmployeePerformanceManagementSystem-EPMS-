# 360° Feedback — Modified Implementation Plan

> Scope: `epms_backend` 360° feedback module (`feedback360` package)
> Based on review of: `Feedback.java`, `FeedbackRequest.java`, `FeedbackSummary.java`, `DepartmentFeedbackConfig.java`, `FeedbackRelationship.java`, `FeedbackStatus.java`, `AppraisalForm.java`, `Question.java`, and the service implementations in `service/feedback360/impl/`.

---

## 0. Guiding Principles

1. **Four feedback sources only** — Self, Direct Manager, Peers, Subordinates. No matrix reporting; one `ReportingLine` per employee.
2. **Anonymity is enforced on the read layer, not just the write layer.**
3. **Missing groups must not deflate scores** — weights renormalize.
4. **Each relationship can have its own form** — manager-form ≠ peer-form ≠ subordinate-form ≠ self-form.
5. **L04 has no manager rater** (top of 360 scope); **L07 has no subordinate rater**. Both are normal — the math handles it.
6. **Single source of truth for direct reports** — `ReportingLineRepository`, not level-rank guessing.

---

## 1. Database / Schema Changes

### 1.1 Modify existing entities

**`FeedbackRelationship` enum** — collapse to four canonical values:

```java
public enum FeedbackRelationship {
    DIRECT_MANAGER,  // canonical name; replaces MANAGER and SUPERIOR
    PEER,
    SUBORDINATE,
    SELF
}
```

Migration: `UPDATE feedback SET relationship='DIRECT_MANAGER' WHERE relationship IN ('MANAGER','SUPERIOR');` Same for `feedback_request`.

**`FeedbackStatus` enum** — add draft state, drop unused:

```java
public enum FeedbackStatus {
    PENDING,        // request created, evaluator not started
    IN_PROGRESS,    // draft saved, not submitted
    COMPLETED,      // submitted
    CANCELLED       // evaluator left org / removed by HR
}
```

Drop `SUBMITTED` (vestigial). Migrate any existing rows to `COMPLETED`.

**`FeedbackRequest`** — add operational fields:

```java
private Instant dueDate;
private Instant startedAt;
private Instant lastReminderSentAt;

// Remove @Builder.Default isAnonymous = true; compute it instead:
@PrePersist @PreUpdate
private void deriveAnonymity() {
    this.isAnonymous = (relationship == PEER || relationship == SUBORDINATE);
}
```

**`AppraisalForm`** — add relationship targeting:

```java
@Enumerated(EnumType.STRING)
@Column(name = "target_relationship")
private FeedbackRelationship targetRelationship; // nullable for non-360 forms
```

Now one cycle can hold four FEEDBACK forms — one per relationship.

**`Question`** — add competency + weight:

```java
@ManyToOne
@JoinColumn(name = "competency_id", nullable = true)
private Competency competency;

```

**`FeedbackSummary`** — add post-calibration and audit fields:

```java
@Column(columnDefinition = "TEXT")
private String managerSummary;

private BigDecimal calibratedFinalScore;
private Instant finalizedAt;
private Long finalizedBy;
```

### 1.2 New entities

**`Competency`** — for cross-form aggregation (Communication, Leadership, Technical, etc.):

```java
@Entity
@Table(name = "competency")
public class Competency extends BaseEntity {
    @Id @GeneratedValue Long id;
    private String name;
    private String description;
    private Boolean isActive = true;
}
```

**`ScoringPolicy`** — replaces hardcoded weights:

```java
@Entity
@Table(name = "scoring_policy",
    uniqueConstraints = @UniqueConstraint(columnNames = {"cycle_id","job_level_id"}))
public class ScoringPolicy extends BaseEntity {
    @Id @GeneratedValue Long id;
    @ManyToOne AppraisalCycle cycle;
    @ManyToOne JobLevel jobLevel;          // nullable → cycle-wide default
    private BigDecimal managerWeight;       // e.g., 0.50
    private BigDecimal peerWeight;          // e.g., 0.30
    private BigDecimal subordinateWeight;   // e.g., 0.20
    private BigDecimal selfWeight;          // e.g., 0.00 (recommended)
    private Boolean includeSelfInFinal;     // policy flag
    private Integer suppressionThreshold;   // typically 3
}
```

**`EvaluatorNomination`** — optional nomination workflow (Phase 3, not required for v1):

```java
@Entity
public class EvaluatorNomination extends BaseEntity {
    @Id @GeneratedValue Long id;
    @ManyToOne Employee targetUser;
    @ManyToOne Employee nominee;
    @Enumerated FeedbackRelationship relationship;
    @Enumerated NominationStatus status;   // PROPOSED, APPROVED, REJECTED
    @ManyToOne Employee nominatedBy;
    @ManyToOne Employee approvedBy;
}
```

---

## 2. Critical Bug Fixes

### Fix 1 — `FeedbackSummaryServiceImpl.generateSummary` deflation bug

**Current bug** (line 50–60): groups only by `MANAGER` (misses `SUPERIOR` for L04), and missing groups multiply zero into `finalScore`, dragging it down.

**Replace `generateSummary` with:**

```java
@Override
@Transactional
public void generateSummary(Long employeeId, Long cycleId) {
    Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new NotFoundException("Employee not found"));
    AppraisalCycle cycle = cycleRepository.findById(cycleId)
            .orElseThrow(() -> new NotFoundException("Cycle not found"));

    List<Feedback> feedbacks = feedbackRepository
            .findByRequestTargetUserIdAndRequestCycleCycleId(employeeId, cycleId);

    Map<FeedbackRelationship, List<Feedback>> grouped = feedbacks.stream()
            .collect(Collectors.groupingBy(Feedback::getRelationship));

    BigDecimal managerScore     = averageOrNull(grouped.get(DIRECT_MANAGER));
    BigDecimal peerScore        = averageOrNull(grouped.get(PEER));
    BigDecimal subordinateScore = averageOrNull(grouped.get(SUBORDINATE));
    BigDecimal selfScore        = averageOrNull(grouped.get(SELF));

    ScoringPolicy policy = scoringPolicyRepository
            .findByCycleAndJobLevel(cycle, employee.getLevel())
            .orElseGet(() -> scoringPolicyRepository.findCycleDefault(cycle));

    Map<FeedbackRelationship, BigDecimal> scores = new EnumMap<>(FeedbackRelationship.class);
    Map<FeedbackRelationship, BigDecimal> weights = new EnumMap<>(FeedbackRelationship.class);
    if (managerScore     != null) { scores.put(DIRECT_MANAGER, managerScore);     weights.put(DIRECT_MANAGER, policy.getManagerWeight()); }
    if (peerScore        != null) { scores.put(PEER, peerScore);                  weights.put(PEER, policy.getPeerWeight()); }
    if (subordinateScore != null) { scores.put(SUBORDINATE, subordinateScore);    weights.put(SUBORDINATE, policy.getSubordinateWeight()); }
    if (selfScore        != null && Boolean.TRUE.equals(policy.getIncludeSelfInFinal())) {
        scores.put(SELF, selfScore);
        weights.put(SELF, policy.getSelfWeight());
    }

    BigDecimal totalWeight = weights.values().stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    BigDecimal finalScore = totalWeight.signum() == 0
            ? null
            : scores.entrySet().stream()
                .map(e -> e.getValue().multiply(weights.get(e.getKey())))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(totalWeight, 2, RoundingMode.HALF_UP);

    FeedbackSummary summary = summaryRepository
            .findByEmployeeIdAndCycleCycleId(employeeId, cycleId)
            .orElse(new FeedbackSummary());
    summary.setEmployee(employee);
    summary.setCycle(cycle);
    summary.setManagerScore(managerScore);
    summary.setPeerScore(peerScore);
    summary.setSubordinateScore(subordinateScore);
    summary.setSelfScore(selfScore);
    summary.setFinalScore(finalScore);
    summary.setTotalEvaluators(feedbacks.size());
    summary.setIsFinalized(false);
    summaryRepository.save(summary);
}

private BigDecimal averageOrNull(List<Feedback> feedbacks) {
    if (feedbacks == null || feedbacks.isEmpty()) return null;
    BigDecimal total = feedbacks.stream()
            .map(Feedback::getAverageScore)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    long n = feedbacks.stream().map(Feedback::getAverageScore).filter(Objects::nonNull).count();
    return n == 0 ? null : total.divide(BigDecimal.valueOf(n), 2, RoundingMode.HALF_UP);
}
```

This handles L04 (no manager) and L07 (no subordinates) correctly — weights renormalize over present groups.

### Fix 2 — `FeedbackSubmissionServiceImpl.submitFeedback` NPE / div-by-zero

**Current bug** (line 70–74): `mapToInt(FeedbackResponse::getScore)` unboxes null; division blows up on empty responses.

**Replace the score block with:**

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

Add validation:

```java
// In FeedbackResponseRequest DTO
@Min(1) @Max(5)
private Integer score;  // nullable for comment-only questions

// In submitFeedback, before building responses
for (FeedbackResponseRequest r : request.getResponses()) {
    Question q = questionRepository.findById(r.getQuestionId())
            .orElseThrow(() -> new NotFoundException("Question not found"));
    if (Boolean.TRUE.equals(q.getIsRequired()) && r.getScore() == null) {
        throw new ValidationException("Required question " + q.getQuestionId() + " missing score");
    }
}
```

### Fix 3 — `FeedbackReportServiceImpl` anonymity + null safety

**Replace the evaluator-name + null-score block (line 54–73) with:**

```java
boolean anonymous = Boolean.TRUE.equals(feedback.getRequest().getIsAnonymous());
String evaluatorName = anonymous
        ? "Anonymous"
        : feedback.getRequest().getEvaluator().getStaffName();

for (FeedbackResponse response : responses) {
    String categoryName = response.getQuestion().getCategory() != null
            ? response.getQuestion().getCategory().getCategoryName()
            : "General";

    Integer score = response.getScore();
    if (score != null) {
        if (relationship == SELF) {
            selfScoresMap.computeIfAbsent(categoryName, k -> new ArrayList<>()).add(score);
        } else {
            othersScoresMap.computeIfAbsent(categoryName, k -> new ArrayList<>()).add(score);
            totalOthersPoints += score;
            totalOthersQuestions++;
        }
    }
    // ...comment handling unchanged but filtered below
}
```

**Add suppression threshold** before returning. Read it from `ScoringPolicy`:

```java
int threshold = policy.getSuppressionThreshold();
Map<FeedbackRelationship, Long> counts = allFeedbacks.stream()
        .collect(Collectors.groupingBy(f -> f.getRequest().getRelationship(), Collectors.counting()));

// Filter comments from groups below threshold
List<DetailedComment> visibleComments = detailedComments.stream()
        .filter(c -> counts.getOrDefault(FeedbackRelationship.valueOf(c.getEvaluatorRole()), 0L) >= threshold)
        .collect(Collectors.toList());
Collections.shuffle(visibleComments);  // prevent submission-order identity leak
```

**Split the response per relationship** so the report actually shows the four-source breakdown:

```java
return FeedbackSummaryResponse.builder()
        // existing fields...
        .managerScores(calculateAverages(managerScoresMap))
        .peerScores(calculateAverages(peerScoresMap))
        .subordinateScores(calculateAverages(subordinateScoresMap))
        .selfScores(calculateAverages(selfScoresMap))
        .selfVsOthersGap(computeGap(selfScoresMap, othersScoresMap))
        .participation(buildParticipationStats(targetUserId, cycleId))
        .detailedComments(visibleComments)
        .build();
```

### Fix 4 — Subordinate lookup: use `ReportingLineRepository`

**`FeedbackRequestServiceImpl.findSubordinatesByDepartment`** currently filters `getLevelRank(e) == (targetRank + 1)` — misses skip-level reports.

**Replace with:**

```java
private List<Employee> findDirectReports(Employee target) {
    return reportingLineRepository.findAllByManagerAndIsActiveTrue(target).stream()
            .map(ReportingLine::getEmployee)
            .filter(e -> e.getStatus() != EmployeeStatus.RESIGNED)
            .collect(Collectors.toList());
}
```

Use this for the subordinate-rater pool. Department-based filtering is no longer needed for subordinates — direct-report relationships are authoritative.

### Fix 5 — Save order in `submitFeedback`

Add cascade on `Feedback.responses`:

```java
@OneToMany(mappedBy = "feedback", cascade = CascadeType.ALL, orphanRemoval = true)
private List<FeedbackResponse> responses = new ArrayList<>();
```

Then in `submitFeedback`:

```java
feedback.setResponses(responses);
feedbackRepository.save(feedback);   // single save, cascade handles children
```

After save, mark the related `FeedbackSummary` stale (or recompute async):

```java
summaryRepository.findByEmployeeIdAndCycleCycleId(
    feedbackRequest.getTargetUser().getId(), feedbackRequest.getCycle().getCycleId())
    .ifPresent(s -> { s.setIsFinalized(false); summaryRepository.save(s); });
```

---

## 3. Service Layer Changes

### 3.1 Consolidate selection flows

You have two parallel selection paths:
- `FeedbackSelectionService.suggestEvaluators` + `confirmEvaluators`
- `FeedbackRequestService.generate360FeedbackRequests`

**Decision:** keep `FeedbackRequestService.generate360FeedbackRequests` as the automatic generator, and refactor `FeedbackSelectionService` to be the manual-override surface only. Both flows must call a shared private helper `createRequestEnforced(...)` that:

1. Looks up the relationship-specific form via `formRepository.findByCycleAndTargetRelationship(cycle, rel)`.
2. Enforces `DepartmentFeedbackConfig` min/max.
3. Enforces workload.
4. Sets `isAnonymous` from `relationship` (no caller override).
5. Sets `dueDate` from cycle.

Delete duplicated peer-finding logic in `FeedbackSelectionServiceImpl`.

### 3.2 Form-per-relationship resolution

Replace the single `defaultForm` lookup in `process360Generation` (line 159–163):

```java
Map<FeedbackRelationship, AppraisalForm> formsByRelationship = cycle.getForms().stream()
        .filter(f -> f.getFormType() == FormType.FEEDBACK)
        .filter(f -> f.getTargetRelationship() != null)
        .collect(Collectors.toMap(AppraisalForm::getTargetRelationship, Function.identity()));
```

Then in `handleRequest`/`createRequest`, pass `formsByRelationship.get(rel)` instead of the single `form`.

### 3.3 Subordinate weight handling for L07 and others

Already covered by Fix 1 — when `maxSubs == 0` no subordinate requests are created, no `SUBORDINATE` feedback exists, and weights renormalize over `{DIRECT_MANAGER, PEER}` (and SELF if policy includes it).

For **L04 specifically**: no manager exists. `assignManager` should accept null `ReportingLine` silently (it currently calls `.ifPresent`, which is correct). The summary will renormalize over `{PEER, SUBORDINATE}` (and SELF if included).

### 3.4 `generateAllSummaries` filtering

Replace `employeeRepository.findAll()` with employees who actually have feedback in the cycle:

```java
List<Long> targetIds = feedbackRepository.findDistinctTargetUserIdsByCycle(cycleId);
for (Long id : targetIds) generateSummary(id, cycleId);
```

### 3.5 Reminder + deadline job

New `@Scheduled` component `FeedbackReminderScheduler`:

```java
@Scheduled(cron = "0 0 9 * * *")  // daily at 09:00
public void runReminders() {
    Instant now = Instant.now();
    // T-7, T-2, T-0 reminders
    requestRepository.findPendingDueWithin(Duration.ofDays(7))
        .forEach(this::sendReminderIfNotRecent);
    // Escalate overdue to the target's manager
    requestRepository.findOverdueByDays(1)
        .forEach(this::escalateToManager);
}
```

Update `lastReminderSentAt` on each notification. Don't double-fire within 24h.

### 3.6 Authorization on read endpoints

Add a guard utility:

```java
@Component
public class FeedbackAccessGuard {
    boolean canViewSummary(Long viewerId, Long targetId) {
        if (viewerId.equals(targetId)) return true;                    // self
        if (isHR(viewerId)) return true;                               // HR/admin
        if (isManagerOf(viewerId, targetId)) return true;              // their manager
        return false;
    }
    boolean canViewRawFeedback(Long viewerId, Long feedbackId) {
        // Only HR/admin and the evaluator themselves
    }
}
```

Apply to `getFeedbackByRequest`, `getMySubmittedFeedbacks`, `getFeedbackReceivedByEmployee`, and the summary endpoints.

---

## 4. Coverage by Level (Reference)

| Level | Direct Manager rater | Peers rater | Subordinates rater | Self |
|---|---|---|---|---|
| L04 | **none (null)** — top of 360 scope | Other L04 (global) | L05 direct reports | yes |
| L05 | L04 head of function | Other L05 | L06 direct reports | yes |
| L06 | L05 manager | Other L06 same team | L07 direct reports (if any) | yes |
| L07 | L06 (or L05 if no L06) | Other L07 same team/dept | **none** | yes |

L01–L03, L08, L09 are out of the 360 scope per current code (`getLevelRank(e) < 8` filter excludes L08/L09, and the generator's `rank < 4` guard excludes L01–L03 as targets; they only appear as evaluators for L04 via `assignTopManagementEvaluator`).

---

## 5. Rollout Order

### Phase 1 — Correctness fixes (blocking, must ship together)

1. Fix 1 — `generateSummary` deflation + DIRECT_MANAGER consolidation.
2. Fix 2 — `submitFeedback` NPE / div-by-zero + score validation.
3. Fix 3 — `getFeedbackSummary` anonymity (honor `isAnonymous`), suppression threshold, comment shuffle, null-score safety.
4. Fix 4 — `findDirectReports` via `ReportingLineRepository`.
5. Enum cleanup: `FeedbackRelationship` → 4 values; `FeedbackStatus` add `IN_PROGRESS`/`CANCELLED`, drop `SUBMITTED`.
6. `FeedbackRequest.isAnonymous` derived in `@PrePersist`.

**Migration script:** rename relationships in existing rows; backfill `dueDate` on existing requests from `cycle.endDate`.

### Phase 2 — Schema + form routing

7. Add `dueDate`, `startedAt`, `lastReminderSentAt` to `FeedbackRequest`.
8. Add `targetRelationship` to `AppraisalForm`; update generation to resolve per relationship.
9. Add `ScoringPolicy` entity + repository + cycle-default rows; remove hardcoded weights.
10. Add `Competency` entity + FK on `Question`; surface per-competency averages in summary.
11. Add `managerSummary`, `calibratedFinalScore`, `finalizedAt`, `finalizedBy` on `FeedbackSummary`.

### Phase 3 — Operational features

12. Reminder/escalation scheduler.
13. Draft save (`IN_PROGRESS` status + autosave endpoint).
14. Authorization guard on all read endpoints.
15. `generateAllSummaries` filter to employees with feedback only.
16. Consolidate `FeedbackSelectionService` and `FeedbackRequestService` behind shared helper.
17. Cycle freeze: reject submissions / regeneration when `summary.isFinalized = true` for the target.

### Phase 4 — Optional enhancements

18. `EvaluatorNomination` workflow (self-nominate → manager approve → HR override).
19. Calibration session UI/API.
20. Reproducible shuffle (seed with `cycleId + targetId`) so previews are deterministic.
21. Data-retention policy: anonymous feedback identity unrecoverable after `finalizedAt + N days`.

---

## 6. Test Plan (per phase)

**Phase 1 unit tests:**

- `generateSummary` for L04 target with peer=80, sub=80, no manager, no self → final = 80 (renormalized), not 56.
- `generateSummary` for L07 target with mgr=70, peer=70, no sub → final = 70.
- `submitFeedback` with empty `responses` → 400, not 500.
- `submitFeedback` with one null score (comment-only) → averages over non-null scores.
- `getFeedbackSummary` with peer count = 1 → peer comments suppressed.
- `getFeedbackSummary` with `isAnonymous=false` on a PEER request → evaluator name still hidden (read layer hardening).

**Phase 2 integration tests:**

- Cycle with four FEEDBACK forms (one per relationship) → each request gets the correct form.
- `ScoringPolicy` override at job-level → L04 policy used instead of cycle default.

**Phase 3 e2e tests:**

- Submit a draft → reload pending → finish submission → status transitions PENDING → IN_PROGRESS → COMPLETED.
- Reminder fires once per 24h.
- HR can view raw feedback; peer-evaluator cannot view others' raw feedback.

---

## 7. Files Touched (summary)

**Modified:**
- `enums/FeedbackRelationship.java`, `enums/FeedbackStatus.java`
- `model/feedback360/Feedback.java`, `FeedbackRequest.java`, `FeedbackSummary.java`
- `model/appraisal/AppraisalForm.java`, `Question.java`
- `service/feedback360/impl/FeedbackSummaryServiceImpl.java` (Fix 1)
- `service/feedback360/impl/FeedbackSubmissionServiceImpl.java` (Fix 2, Fix 5)
- `service/feedback360/impl/FeedbackReportServiceImpl.java` (Fix 3)
- `service/feedback360/impl/FeedbackRequestServiceImpl.java` (Fix 4, form-per-relationship)
- `dto/feedback360/FeedbackSummaryResponse.java` (add per-relationship breakdown, gap, participation)
- `dto/feedback360/FeedbackResponseRequest.java` (add @Min/@Max)

**New:**
- `model/feedback360/Competency.java`
- `model/feedback360/ScoringPolicy.java`
- `model/feedback360/EvaluatorNomination.java` (Phase 4)
- `repository/feedback360/CompetencyRepository.java`
- `repository/feedback360/ScoringPolicyRepository.java`
- `service/feedback360/FeedbackReminderScheduler.java`
- `service/feedback360/FeedbackAccessGuard.java`
- `db/migration/Vxxx__feedback_360_modifications.sql`

---

## 8. Recommended Default Scoring Policy

Seed one row per cycle as the cycle-wide default; override per job level only when needed.

| Job Level | Manager | Peer | Subordinate | Self | includeSelfInFinal | suppressionThreshold |
|---|---|---|---|---|---|---|
| (cycle default) | 0.50 | 0.30 | 0.20 | 0.00 | false | 3 |
| L04 (no manager) | 0.00 | 0.60 | 0.40 | 0.00 | false | 3 |
| L07 (no subordinate) | 0.60 | 0.40 | 0.00 | 0.00 | false | 3 |

Renormalization in code makes the L04/L07 rows optional — they're explicit so policy admins don't have to trust the math.
