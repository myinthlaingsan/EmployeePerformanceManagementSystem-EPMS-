package ace.org.epms_backend.service.kpi.impl;

import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.dto.kpi.KpiScoreResponse;
import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.enums.AuditAction;
import ace.org.epms_backend.enums.AuditStatus;
import ace.org.epms_backend.enums.KpiGoalStatus;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.KpiMapper;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.kpi.KpiFinalScore;
import ace.org.epms_backend.model.kpi.KpiGoalItem;
import ace.org.epms_backend.model.kpi.KpiGoals;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.AuditService;
import ace.org.epms_backend.service.kpi.KpiScoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KpiScoringServiceImpl implements KpiScoringService {

        private final KpiGoalsRepository goalsRepository;
        private final KpiGoalItemRepository goalItemRepository;
        private final KpiFinalScoreRepository finalScoreRepository;
        private final EmployeeRepository employeeRepository;
        private final AppraisalRepository appraisalRepository;
        private final KpiMapper kpiMapper;
        private final AuditService auditService;
        private final ApplicationEventPublisher eventPublisher;

        @Override
        @Transactional
        public KpiScoreResponse calculateFinalScore(Long employeeId, Long cycleId) {
                KpiGoals goalSet = goalsRepository
                                .findByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(employeeId, cycleId)
                                .orElseThrow(() -> new NotFoundException("Current goal set not found"));

                Employee currentUser = getCurrentEmployee();

                // HR and ADMIN can calculate score for anyone
                boolean isHrOrAdmin = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                                .anyMatch(a -> a.getAuthority().equals("ROLE_HR")
                                                || a.getAuthority().equals("ROLE_ADMIN"));

                if (!isHrOrAdmin) {
                        // If Manager, must be the assigned manager for this goal set
                        // Guard against null manager (HR/Admin-assigned goals with no reporting line)
                        if (goalSet.getManager() == null
                                        || !goalSet.getManager().getId().equals(currentUser.getId())) {
                                throw new SecurityException(
                                                "You are not authorized to calculate or view scores for this employee");
                        }
                }

                // Precondition 1: Is the appraisal cycle actually finished?
                // if (goalSet.getCycle().getIsActive()) {
                // throw new IllegalStateException("Cannot calculate final score while the
                // appraisal cycle is still active.");
                // }

                // Precondition 2: Block ARCHIVED status only
                if (goalSet.getStatus().equals(KpiGoalStatus.ARCHIVED)) {
                        throw new IllegalStateException("Cannot calculate score for an archived goal set.");
                }

                // Precondition 3: Is the employee still active?
                if (goalSet.getEmployee().getIsActive() != null && !goalSet.getEmployee().getIsActive()) {
                        throw new IllegalStateException("Cannot calculate score for an inactive employee.");
                }



                List<KpiGoalItem> items = goalItemRepository.findByGoalSetIdAndIsActiveTrue(goalSet.getId());

                // Precondition 5: Are all goal items at 100% weight total?
                BigDecimal totalWeight = items.stream()
                                .map(item -> item.getWeightPercent() != null ? item.getWeightPercent()
                                                : BigDecimal.ZERO)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                if (totalWeight.compareTo(new BigDecimal("100")) != 0) {
                        throw new IllegalStateException(
                                        "Total weight of active KPI items must be exactly 100%. Current: " + totalWeight
                                                        + "%");
                }

                BigDecimal totalWeightedScore = items.stream()
                                .map(item -> item.getWeightedScore() != null ? item.getWeightedScore()
                                                : BigDecimal.ZERO)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                // Unweighted average: sum of individual scorePercents / item count
                // Represents raw completion rate regardless of weight distribution
                BigDecimal totalAchievementPercent = items.isEmpty() ? BigDecimal.ZERO
                                : items.stream()
                                                .map(item -> item.getScorePercent() != null
                                                                ? item.getScorePercent().min(new BigDecimal("100"))
                                                                : BigDecimal.ZERO)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add)
                                                .divide(new BigDecimal(items.size()), 2, RoundingMode.HALF_UP);

                // UPSERT: find existing score or create new one
                KpiFinalScore finalScore = finalScoreRepository
                                .findByEmployee_IdAndGoalSet_Cycle_CycleId(employeeId, cycleId)
                                .orElse(new KpiFinalScore());

                boolean isNew = (finalScore.getId() == null);

                finalScore.setEmployee(goalSet.getEmployee());
                finalScore.setGoalSet(goalSet);
                finalScore.setWeightedScore(totalWeightedScore);
                finalScore.setTotalAchievementPercent(totalAchievementPercent);
                finalScore.setCalculatedAt(Instant.now());
                finalScore.setFinalizedBy(getCurrentEmployee().getId());

                // Link to Appraisal if exists (using explicit query for maximum reliability)
                appraisalRepository.findByEmployeeAndCycleIds(employeeId, cycleId)
                                .ifPresent(finalScore::setAppraisal);

                KpiFinalScore savedScore = finalScoreRepository.save(finalScore);

                // Notify employee that their final KPI score has been published
                if (goalSet.getEmployee() != null) {
                        eventPublisher.publishEvent(NotificationEvent.builder()
                                        .recipientId(goalSet.getEmployee().getId())
                                        .senderId(getCurrentEmployee().getId())
                                        .type(NotificationType.FINAL_RESULT_PUBLISHED)
                                        .title("KPI Final Score Published")
                                        .message("Your KPI final score for the '" + goalSet.getCycle().getCycleName()
                                                        + "' cycle has been calculated. Your weighted score is "
                                                        + totalWeightedScore + "%.")
                                        .referenceType(ReferenceType.KPI)
                                        .referenceId(goalSet.getId())
                                        .actionUrl("/kpi/my")
                                        .build());
                }

                // Log Audit — correctly use isNew flag
                auditService.log(AuditRequest.builder()
                                .tableName("kpi_final_score")
                                .recordId(savedScore.getId())
                                .action(isNew ? AuditAction.INSERT : AuditAction.UPDATE)
                                .newState(savedScore)
                                .status(AuditStatus.SUCCESS)
                                .build());
                return kpiMapper.toScoreResponse(savedScore);
        }

        @Override
        public KpiScoreResponse getFinalScore(Long employeeId, Long cycleId) {
                return finalScoreRepository
                        .findByEmployee_IdAndGoalSet_Cycle_CycleId(employeeId, cycleId)
                        .map(kpiMapper::toScoreResponse)
                        .orElse(null);
        }

        private Employee getCurrentEmployee() {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                return employeeRepository.findByEmail(email)
                                .orElseThrow(() -> new NotFoundException("Current user not found"));
        }

}
