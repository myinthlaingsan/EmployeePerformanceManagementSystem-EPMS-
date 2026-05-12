package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.feedback360.EvaluatorAssignmentDTO;
import ace.org.epms_backend.enums.FeedbackRelationship;
import ace.org.epms_backend.enums.FeedbackStatus;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.feedback360.FeedbackRequest;
import ace.org.epms_backend.repository.AppraisalCycleRepository;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackRequestRepository;
import ace.org.epms_backend.service.feedback360.EvaluatorRotationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * EvaluatorRotationServiceImpl
 * <p>
 * Implements the Evaluator Rotation Rule for 360° Feedback:
 * <ul>
 *   <li>L01–L03 (Top Management) evaluate L04 (Department Heads).</li>
 *   <li>If Evaluator A evaluated Target B in the PREVIOUS cycle, they are skipped for the CURRENT cycle.</li>
 *   <li>If the entire pool has already evaluated the target (no fresh evaluators remain), the system
 *       falls back to Round Robin — picking the evaluator with the OLDEST assignment date.</li>
 * </ul>
 *
 * <p>Level hierarchy assumption (levelRank):
 * <ul>
 *   <li>L01 = levelRank 1 (Chairman)</li>
 *   <li>L02 = levelRank 2 (CEO)</li>
 *   <li>L03 = levelRank 3 (COO / MD)</li>
 *   <li>L04 = levelRank 4 (Department Heads — targets)</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EvaluatorRotationServiceImpl implements EvaluatorRotationService {

    // Level ranks for Top Management evaluators and Department Head targets
    private static final int TOP_MGMT_MAX_RANK = 3;  // L01, L02, L03
    private static final int DEPT_HEAD_RANK    = 4;  // L04

    private final EmployeeRepository          employeeRepository;
    private final FeedbackRequestRepository   feedbackRequestRepository;
    private final AppraisalCycleRepository    appraisalCycleRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    public Employee assignTopManagementEvaluator(Long targetEmployeeId,
                                                  Long currentCycleId,
                                                  Long previousCycleId) {
        // 1. Get the full Top Management pool (L01–L03)
        List<Employee> pool = getTopManagementPool();

        if (pool.isEmpty()) {
            log.warn("No Top Management evaluators (L01-L03) found. Skipping rotation rule for target [{}].", targetEmployeeId);
            return null;
        }

        // 2. Get evaluators who already evaluated this target in the PREVIOUS cycle
        Set<Long> recentEvaluatorIds = getRecentEvaluatorIds(targetEmployeeId, previousCycleId);
        log.info("Target [{}] | Previous cycle [{}] | Recently used evaluator IDs: {}",
                targetEmployeeId, previousCycleId, recentEvaluatorIds);

        // 3. Filter the pool — exclude evaluators used in the last cycle
        List<Employee> validPool = pool.stream()
                .filter(e -> !recentEvaluatorIds.contains(e.getId()))
                .collect(Collectors.toList());

        // 4. If a fresh evaluator exists, pick the first one
        if (!validPool.isEmpty()) {
            Employee selected = validPool.get(0);
            log.info("Rotation Rule → Assigned evaluator [{}] to target [{}] for cycle [{}]",
                    selected.getId(), targetEmployeeId, currentCycleId);
            return selected;
        }

        // 5. Round Robin fallback — everyone has evaluated this target before.
        //    Pick the one with the OLDEST (least recent) assignment.
        log.warn("All Top Management evaluators have previously evaluated target [{}]. " +
                "Applying Round Robin (oldest first) fallback.", targetEmployeeId);
        return getOldestEvaluator(pool, targetEmployeeId);
    }

    @Override
    @Transactional
    public void generateTopManagementAssignments(Long currentCycleId, Long previousCycleId) {
        AppraisalCycle currentCycle = appraisalCycleRepository.findById(currentCycleId)
                .orElseThrow(() -> new RuntimeException("Appraisal cycle not found: " + currentCycleId));

        // Get all L04 Department Heads
        List<Employee> deptHeads = getDeptHeadTargets();
        log.info("Found {} Department Head(s) (L04) to assign evaluators for cycle [{}]",
                deptHeads.size(), currentCycleId);

        for (Employee target : deptHeads) {
            // Skip if an assignment already exists for this target in the current cycle
            boolean alreadyAssigned = feedbackRequestRepository
                    .findByTargetUserIdAndCycleCycleId(target.getId(), currentCycleId)
                    .stream()
                    .anyMatch(fr -> fr.getRelationship() == FeedbackRelationship.SUPERIOR);

            if (alreadyAssigned) {
                log.info("Skipping target [{}] — SUPERIOR assignment already exists for cycle [{}]",
                        target.getId(), currentCycleId);
                continue;
            }

            // Apply rotation rule to find the best evaluator
            Employee evaluator = assignTopManagementEvaluator(
                    target.getId(), currentCycleId, previousCycleId);

            // Save the FeedbackRequest
            FeedbackRequest request = FeedbackRequest.builder()
                    .targetUser(target)
                    .evaluator(evaluator)
                    .cycle(currentCycle)
                    .relationship(FeedbackRelationship.SUPERIOR)
                    .isAnonymous(false)       // Top Management assignments are not anonymous
                    .status(FeedbackStatus.PENDING)
                    .build();

            feedbackRequestRepository.save(request);
            log.info("Saved FeedbackRequest: evaluator [{}] → target [{}] | cycle [{}]",
                    evaluator.getId(), target.getId(), currentCycleId);
        }
    }

    @Override
    public List<EvaluatorAssignmentDTO> previewTopManagementAssignments(Long currentCycleId,
                                                                         Long previousCycleId) {
        AppraisalCycle currentCycle = appraisalCycleRepository.findById(currentCycleId)
                .orElseThrow(() -> new RuntimeException("Appraisal cycle not found: " + currentCycleId));

        List<Employee> pool      = getTopManagementPool();
        List<Employee> deptHeads = getDeptHeadTargets();
        List<EvaluatorAssignmentDTO> result = new ArrayList<>();

        for (Employee target : deptHeads) {
            Set<Long> recentIds = getRecentEvaluatorIds(target.getId(), previousCycleId);

            List<Employee> validPool = pool.stream()
                    .filter(e -> !recentIds.contains(e.getId()))
                    .collect(Collectors.toList());

            boolean fallback = validPool.isEmpty();
            Employee selected = fallback
                    ? getOldestEvaluator(pool, target.getId())
                    : validPool.get(0);

            result.add(EvaluatorAssignmentDTO.builder()
                    .targetEmployeeId(target.getId())
                    .targetEmployeeName(target.getStaffName())
                    .targetLevelCode(target.getLevel() != null
                            ? target.getLevel().getLevelCode() : "L04")
                    .evaluatorId(selected.getId())
                    .evaluatorName(selected.getStaffName())
                    .evaluatorLevelCode(selected.getLevel() != null
                            ? selected.getLevel().getLevelCode() : "L0X")
                    .cycleId(currentCycleId)
                    .cycleName(currentCycle.getCycleName())
                    .roundRobinFallback(fallback)
                    .build());
        }
        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns all active employees whose job level rank is 1–3 (L01, L02, L03).
     */
    private List<Employee> getTopManagementPool() {
        return employeeRepository.findAll().stream()
                .filter(e -> e.getLevel() != null
                        && e.getLevel().getLevelRank() != null
                        && e.getLevel().getLevelRank() <= TOP_MGMT_MAX_RANK
                        && Boolean.TRUE.equals(e.getIsActive()))
                .sorted(Comparator.comparingInt(e -> e.getLevel().getLevelRank()))
                .collect(Collectors.toList());
    }

    /**
     * Returns all active employees whose job level rank is exactly 4 (L04 Department Heads).
     */
    private List<Employee> getDeptHeadTargets() {
        return employeeRepository.findAll().stream()
                .filter(e -> e.getLevel() != null
                        && e.getLevel().getLevelRank() != null
                        && e.getLevel().getLevelRank() == DEPT_HEAD_RANK
                        && Boolean.TRUE.equals(e.getIsActive()))
                .collect(Collectors.toList());
    }

    /**
     * Returns the set of evaluator IDs who evaluated the target in the given (previous) cycle.
     * Returns an empty set if previousCycleId is null (i.e., first cycle ever).
     */
    private Set<Long> getRecentEvaluatorIds(Long targetId, Long previousCycleId) {
        if (previousCycleId == null) {
            return Set.of();
        }
        return feedbackRequestRepository
                .findEvaluatorsByTargetAndCycleAndRelationship(
                        targetId, previousCycleId, FeedbackRelationship.SUPERIOR)
                .stream()
                .map(Employee::getId)
                .collect(Collectors.toSet());
    }

    /**
     * Round Robin fallback: picks the evaluator from the pool whose last assignment
     * to the given target is the OLDEST (least recently evaluated = first in line again).
     *
     * @param pool     the full Top Management evaluator pool
     * @param targetId the target employee being evaluated
     * @return the evaluator with the oldest assignment, or the first in the pool if no history
     */
    private Employee getOldestEvaluator(List<Employee> pool, Long targetId) {
        // Retrieve all historical assignments to this target, oldest-first
        List<FeedbackRequest> history = feedbackRequestRepository
                .findAllByTargetOrderedByOldestFirst(targetId, FeedbackRelationship.SUPERIOR);

        if (history.isEmpty()) {
            // No history at all — just return the first evaluator in the pool
            return pool.get(0);
        }

        // Map each pool member to their oldest assignment index
        // The evaluator who appears FIRST (earliest) in history is the Least Recently Evaluated
        // and should be selected.
        Set<Long> poolIds = pool.stream().map(Employee::getId).collect(Collectors.toSet());

        for (FeedbackRequest fr : history) {
            Long evaluatorId = fr.getEvaluator().getId();
            if (poolIds.contains(evaluatorId)) {
                // This evaluator is in the pool and has the oldest assignment to this target
                return pool.stream()
                        .filter(e -> e.getId().equals(evaluatorId))
                        .findFirst()
                        .orElse(pool.get(0));
            }
        }

        // Fallback: no match found in history, return first pool member
        return pool.get(0);
    }
}
