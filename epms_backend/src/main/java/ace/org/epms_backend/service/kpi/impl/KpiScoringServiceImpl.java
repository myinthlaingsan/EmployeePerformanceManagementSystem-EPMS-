package ace.org.epms_backend.service.kpi.impl;

import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.dto.kpi.KpiScoreResponse;
import ace.org.epms_backend.enums.AuditAction;
import ace.org.epms_backend.enums.AuditStatus;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.KpiMapper;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.kpi.KpiFinalScore;
import ace.org.epms_backend.model.kpi.KpiGoalItem;
import ace.org.epms_backend.model.kpi.KpiGoals;
import ace.org.epms_backend.model.kpi.KpiProgress;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.AuditService;
import ace.org.epms_backend.service.kpi.KpiScoringService;
import lombok.RequiredArgsConstructor;
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
    private final KpiProgressRepository progressRepository;
    private final KpiFinalScoreRepository finalScoreRepository;
    private final EmployeeRepository employeeRepository;
    private final KpiMapper kpiMapper;
    private final AuditService auditService;

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
            if (!goalSet.getManager().getId().equals(currentUser.getId())) {
                throw new SecurityException(
                        "You are not authorized to calculate or view scores for this employee");
            }
        }

        List<KpiGoalItem> items = goalItemRepository.findByGoalSetIdAndIsActiveTrue(goalSet.getId());

        BigDecimal totalWeightedScore = BigDecimal.ZERO;

        for (KpiGoalItem item : items) {
            List<KpiProgress> progressList = progressRepository.findByGoalItemIdOrderByIdDesc(item.getId());
            BigDecimal latestActual = progressList.isEmpty() ? BigDecimal.ZERO
                    : progressList.get(0).getActualValue();

            BigDecimal score = BigDecimal.ZERO;
            if (item.getTargetValue() != null && item.getTargetValue().compareTo(BigDecimal.ZERO) != 0) {
                score = latestActual.divide(item.getTargetValue(), 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"));
            }

            BigDecimal weightedScore = score
                    .multiply(item.getWeightPercent().divide(new BigDecimal("100"), 4,
                            RoundingMode.HALF_UP));

            totalWeightedScore = totalWeightedScore.add(weightedScore);
        }

        KpiFinalScore finalScore = finalScoreRepository.findByEmployeeIdAndCycleId(employeeId, cycleId)
                .orElse(new KpiFinalScore());

        finalScore.setEmployee(goalSet.getEmployee());
        finalScore.setGoalSet(goalSet);
        finalScore.setWeightedScore(totalWeightedScore);
        finalScore.setTotalAchievementPercent(totalWeightedScore);
        finalScore.setCalculatedAt(Instant.now());
        finalScore.setFinalizedBy(getCurrentEmployee().getId());

        KpiFinalScore savedScore = finalScoreRepository.save(finalScore);

        // Log Audit
        auditService.log(AuditRequest.builder()
                .tableName("kpi_final_score")
                .recordId(savedScore.getId())
                .action(savedScore.getId() == null ? AuditAction.INSERT : AuditAction.UPDATE)
                .newState(savedScore)
                .status(AuditStatus.SUCCESS)
                .build());

        return kpiMapper.toScoreResponse(savedScore);
    }

    private Employee getCurrentEmployee() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return employeeRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Current user not found"));
    }
}
