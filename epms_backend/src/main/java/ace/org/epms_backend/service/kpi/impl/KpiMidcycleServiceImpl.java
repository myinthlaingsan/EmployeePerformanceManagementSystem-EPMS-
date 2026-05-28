package ace.org.epms_backend.service.kpi.impl;

import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.dto.kpi.MidcycleChangeRequest;
import ace.org.epms_backend.dto.kpi.MidcyclePhaseResponse;
import ace.org.epms_backend.dto.kpi.MidcycleSummaryResponse;
import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.enums.AuditAction;
import ace.org.epms_backend.enums.AuditStatus;
import ace.org.epms_backend.enums.CycleStatus;
import ace.org.epms_backend.enums.KpiGoalStatus;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.PhaseStatus;
import ace.org.epms_backend.enums.ReferenceType;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.kpi.KpiFinalScore;
import ace.org.epms_backend.model.kpi.KpiGoalPhase;
import ace.org.epms_backend.model.kpi.KpiGoals;
import ace.org.epms_backend.model.kpi.KpiHistoryLog;
import ace.org.epms_backend.model.kpi.KpiMidcycleFinalScore;
import ace.org.epms_backend.repository.AppraisalCycleRepository;
import ace.org.epms_backend.repository.AppraisalRepository;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.KpiFinalScoreRepository;
import ace.org.epms_backend.repository.KpiGoalPhaseRepository;
import ace.org.epms_backend.repository.KpiGoalsRepository;
import ace.org.epms_backend.repository.KpiHistoryLogRepository;
import ace.org.epms_backend.repository.KpiMidcycleFinalScoreRepository;
import ace.org.epms_backend.service.AuditService;
import ace.org.epms_backend.service.kpi.KpiGoalService;
import ace.org.epms_backend.service.kpi.KpiMidcycleService;
import ace.org.epms_backend.service.kpi.KpiScoringService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class KpiMidcycleServiceImpl implements KpiMidcycleService {

    private final KpiGoalsRepository goalsRepository;
    private final KpiGoalPhaseRepository phaseRepository;
    private final KpiMidcycleFinalScoreRepository midcycleFinalScoreRepository;
    private final KpiFinalScoreRepository finalScoreRepository;
    private final KpiHistoryLogRepository historyRepo;
    private final EmployeeRepository employeeRepository;
    private final AppraisalCycleRepository cycleRepository;
    private final AppraisalRepository appraisalRepository;
    private final KpiGoalService kpiGoalService;
    private final KpiScoringService kpiScoringService;
    private final ApplicationEventPublisher eventPublisher;
    private final AuditService auditService;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public void triggerMidcycleChange(MidcycleChangeRequest request) {
        LocalDate changeDate = request.getChangeDate();
        Long employeeId = request.getEmployeeId();
        Long cycleId = request.getCycleId();

        AppraisalCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new NotFoundException("Appraisal cycle not found"));

        ensureCycleAllowsMidcycleChange(cycle);

        LocalDate today = LocalDate.now();
        if (changeDate.isAfter(today)) {
            throw new IllegalArgumentException("Change date cannot be in the future. Latest allowed date is " + today);
        }

        if (changeDate.isBefore(cycle.getStartDate()) || changeDate.isAfter(cycle.getEndDate().minusDays(1))) {
            throw new IllegalArgumentException("Change date must be between cycle start date (" 
                    + cycle.getStartDate() + ") and one day before cycle end date (" + cycle.getEndDate().minusDays(1) + ")");
        }

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        Employee currentUser = getCurrentEmployee();

        Optional<KpiGoalPhase> openPhaseOpt = phaseRepository.findByEmployee_IdAndCycle_CycleIdAndStatus(employeeId, cycleId, PhaseStatus.OPEN);

        KpiGoalPhase currentPhase;
        int nextPhaseNumber = 1;

        if (openPhaseOpt.isEmpty()) {
            KpiGoals currentGoalSet = goalsRepository.findByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(employeeId, cycleId)
                    .orElseThrow(() -> new NotFoundException("No active goal set found for this employee and cycle. Please assign KPIs first."));

            List<KpiGoalPhase> existingPhases = phaseRepository.findByEmployee_IdAndCycle_CycleIdOrderByPhaseNumberAsc(employeeId, cycleId);
            if (!existingPhases.isEmpty()) {
                currentPhase = createOpenPhaseAfterLatest(employee, cycle, currentGoalSet, existingPhases);
                nextPhaseNumber = currentPhase.getPhaseNumber() + 1;
            } else {
                currentPhase = KpiGoalPhase.builder()
                        .employee(employee)
                        .cycle(cycle)
                        .goalSet(currentGoalSet)
                        .phaseNumber(1)
                        .phaseStartDate(cycle.getStartDate())
                        .status(PhaseStatus.OPEN)
                        .build();

                nextPhaseNumber = 2;
            }
        } else {
            currentPhase = openPhaseOpt.get();
            nextPhaseNumber = currentPhase.getPhaseNumber() + 1;

            if (currentPhase.getGoalSet() == null) {
                throw new IllegalStateException("Cannot trigger midcycle change: No goal set has been assigned to the current phase yet.");
            }
        }

        if (changeDate.isBefore(currentPhase.getPhaseStartDate())) {
            throw new IllegalArgumentException("Change date cannot be before current phase start date (" + currentPhase.getPhaseStartDate() + ")");
        }

        currentPhase.setPhaseEndDate(changeDate);
        int phaseDays = (int) ChronoUnit.DAYS.between(currentPhase.getPhaseStartDate(), changeDate) + 1;
        currentPhase.setPhaseDays(phaseDays);
        currentPhase.setChangeReason(request.getChangeReason());
        currentPhase.setTriggeredBy(currentUser.getId());

        KpiGoals goalSet = currentPhase.getGoalSet();
        if (goalSet.getStatus() == KpiGoalStatus.DRAFT) {
            throw new IllegalStateException("Goal set for the current phase is in DRAFT status. It must be approved before triggering a midcycle change.");
        }

        if (goalSet.getStatus() == KpiGoalStatus.APPROVED) {
            kpiGoalService.lockGoalSet(goalSet.getId());
        }

        kpiScoringService.calculateFinalScore(employeeId, cycleId);

        KpiFinalScore finalScore = finalScoreRepository.findByEmployee_IdAndGoalSet_Cycle_CycleId(employeeId, cycleId)
                .orElseThrow(() -> new NotFoundException("Calculated final score not found"));

        currentPhase.setPhaseScore(finalScore.getWeightedScore());
        currentPhase.setStatus(PhaseStatus.SCORED);
        
        phaseRepository.save(currentPhase);

        goalSet.setIsCurrent(false);
        goalsRepository.save(goalSet);

        KpiGoalPhase newPhase = KpiGoalPhase.builder()
                .employee(employee)
                .cycle(cycle)
                .phaseNumber(nextPhaseNumber)
                .phaseStartDate(changeDate.plusDays(1))
                .status(PhaseStatus.OPEN)
                .build();
        
        phaseRepository.save(newPhase);

        Employee manager = goalSet.getManager();
        if (manager != null) {
            eventPublisher.publishEvent(NotificationEvent.builder()
                    .recipientId(manager.getId())
                    .senderId(currentUser.getId())
                    .type(NotificationType.KPI_ASSIGNED)
                    .title("Action Required: Assign New KPIs")
                    .message("A midcycle change was triggered for " + employee.getStaffName() 
                            + ". Please assign KPIs for the new phase starting on " + changeDate.plusDays(1) + ".")
                    .referenceType(ReferenceType.KPI)
                    .referenceId(goalSet.getId())
                    .actionUrl("/kpi/management")
                    .build());
        }

        historyRepo.save(KpiHistoryLog.builder()
                .employeeId(employee.getId())
                .goalSetId(goalSet.getId())
                .action("MID_CYCLE_EVENT")
                .changeReason(request.getChangeReason())
                .changeDetails("Midcycle KPI split triggered for " + employee.getStaffName()
                        + ". Phase " + currentPhase.getPhaseNumber() + " closed on " + changeDate
                        + " with score " + currentPhase.getPhaseScore()
                        + ". Phase " + newPhase.getPhaseNumber() + " opened on " + newPhase.getPhaseStartDate()
                        + " and is waiting for KPI assignment.")
                .changedBy(currentUser.getId())
                .build());
        
        auditService.log(AuditRequest.builder()
                .tableName("kpi_goal_phases")
                .recordId(currentPhase.getId())
                .action(AuditAction.UPDATE)
                .newState(currentPhase)
                .status(AuditStatus.SUCCESS)
                .build());
    }

    @Override
    @Transactional
    public void calculateCompositeFinalScore(Long employeeId, Long cycleId) {
        AppraisalCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new NotFoundException("Appraisal cycle not found"));

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        Employee currentUser = getCurrentEmployee();

        List<KpiGoalPhase> phases = phaseRepository.findByEmployee_IdAndCycle_CycleIdOrderByPhaseNumberAsc(employeeId, cycleId);

        if (phases.isEmpty()) {
            throw new IllegalStateException("No midcycle phases found for this employee and cycle.");
        }

        KpiGoalPhase lastPhase = phases.get(phases.size() - 1);
        if (lastPhase.getStatus() == PhaseStatus.OPEN) {
            lastPhase.setPhaseEndDate(cycle.getEndDate());
            int phaseDays = (int) ChronoUnit.DAYS.between(lastPhase.getPhaseStartDate(), cycle.getEndDate()) + 1;
            lastPhase.setPhaseDays(phaseDays);
            lastPhase.setChangeReason("Appraisal cycle end finalization");
            lastPhase.setTriggeredBy(currentUser.getId());

            KpiGoals goalSet = lastPhase.getGoalSet();
            if (goalSet == null) {
                throw new IllegalStateException("Cannot finalize composite score: The last phase does not have KPIs assigned.");
            }

            if (goalSet.getStatus() == KpiGoalStatus.DRAFT) {
                throw new IllegalStateException("The goal set for the final phase is in DRAFT status. It must be approved before finalization.");
            }

            if (goalSet.getStatus() == KpiGoalStatus.APPROVED) {
                kpiGoalService.lockGoalSet(goalSet.getId());
            }

            kpiScoringService.calculateFinalScore(employeeId, cycleId);

            KpiFinalScore finalScore = finalScoreRepository.findByEmployee_IdAndGoalSet_Cycle_CycleId(employeeId, cycleId)
                    .orElseThrow(() -> new NotFoundException("Calculated final score for last phase not found"));

            lastPhase.setPhaseScore(finalScore.getWeightedScore());
            lastPhase.setStatus(PhaseStatus.SCORED);
            
            phaseRepository.save(lastPhase);

            goalSet.setIsCurrent(false);
            goalsRepository.save(goalSet);
        }

        int totalCycleDays = (int) ChronoUnit.DAYS.between(cycle.getStartDate(), cycle.getEndDate()) + 1;
        BigDecimal totalWeightedScoreSum = BigDecimal.ZERO;
        BigDecimal totalAchievementPercentSum = BigDecimal.ZERO;

        for (KpiGoalPhase phase : phases) {
            BigDecimal days = BigDecimal.valueOf(phase.getPhaseDays());
            BigDecimal weight = days.divide(BigDecimal.valueOf(totalCycleDays), 6, RoundingMode.HALF_UP);
            phase.setPhaseWeight(weight);
            phaseRepository.save(phase);

            BigDecimal score = phase.getPhaseScore() != null ? phase.getPhaseScore() : BigDecimal.ZERO;
            totalWeightedScoreSum = totalWeightedScoreSum.add(score.multiply(weight));

            TypedQuery<KpiFinalScore> query = entityManager.createQuery(
                "SELECT f FROM KpiFinalScore f WHERE f.employee.id = :empId AND f.goalSet.id = :gsId", KpiFinalScore.class);
            query.setParameter("empId", employeeId);
            query.setParameter("gsId", phase.getGoalSet().getId());
            List<KpiFinalScore> list = query.getResultList();
            KpiFinalScore phaseFinalScore = list.isEmpty() ? null : list.get(0);
            
            BigDecimal achievement = (phaseFinalScore != null && phaseFinalScore.getTotalAchievementPercent() != null) 
                    ? phaseFinalScore.getTotalAchievementPercent() : BigDecimal.ZERO;
            totalAchievementPercentSum = totalAchievementPercentSum.add(achievement.multiply(weight));
        }

        StringBuilder breakdownBuilder = new StringBuilder("[");
        for (int i = 0; i < phases.size(); i++) {
            KpiGoalPhase p = phases.get(i);
            breakdownBuilder.append(String.format(
                    "{\"phaseNumber\":%d,\"startDate\":\"%s\",\"endDate\":\"%s\",\"days\":%d,\"weight\":%s,\"score\":%s}",
                    p.getPhaseNumber(), p.getPhaseStartDate(), p.getPhaseEndDate(), p.getPhaseDays(), p.getPhaseWeight(), p.getPhaseScore()
            ));
            if (i < phases.size() - 1) {
                breakdownBuilder.append(",");
            }
        }
        breakdownBuilder.append("]");

        KpiMidcycleFinalScore midcycleScore = midcycleFinalScoreRepository.findByEmployee_IdAndCycle_CycleId(employeeId, cycleId)
                .orElse(new KpiMidcycleFinalScore());
        
        midcycleScore.setEmployee(employee);
        midcycleScore.setCycle(cycle);
        midcycleScore.setTotalPhases(phases.size());
        midcycleScore.setCompositeScore(totalWeightedScoreSum.setScale(4, RoundingMode.HALF_UP));
        midcycleScore.setPhaseBreakdown(breakdownBuilder.toString());
        midcycleScore.setCalculatedAt(Instant.now());
        midcycleScore.setCalculatedBy(currentUser.getId());

        midcycleFinalScoreRepository.save(midcycleScore);

        KpiGoals lastPhaseGoalSet = lastPhase.getGoalSet();
        KpiFinalScore finalScore = finalScoreRepository.findByEmployee_IdAndGoalSet_Cycle_CycleId(employeeId, cycleId)
                .orElse(new KpiFinalScore());

        finalScore.setEmployee(employee);
        finalScore.setGoalSet(lastPhaseGoalSet);
        finalScore.setWeightedScore(totalWeightedScoreSum.setScale(4, RoundingMode.HALF_UP));
        finalScore.setTotalAchievementPercent(totalAchievementPercentSum.setScale(2, RoundingMode.HALF_UP));
        finalScore.setCalculatedAt(Instant.now());
        finalScore.setFinalizedBy(currentUser.getId());

        appraisalRepository.findByEmployeeAndCycleIds(employeeId, cycleId).ifPresent(finalScore::setAppraisal);

        finalScoreRepository.save(finalScore);
    }

    @Override
    @Transactional(readOnly = true)
    public MidcycleSummaryResponse getMidcycleSummary(Long employeeId, Long cycleId) {
        Employee currentUser = getCurrentEmployee();
        if (!canViewEmployeeSummary(currentUser, employeeId)) {
            throw new SecurityException("You are not authorized to view this employee's midcycle KPI summary.");
        }

        AppraisalCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new NotFoundException("Appraisal cycle not found"));

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        List<KpiGoalPhase> phases = phaseRepository.findByEmployee_IdAndCycle_CycleIdOrderByPhaseNumberAsc(employeeId, cycleId);

        int totalCycleDays = (int) ChronoUnit.DAYS.between(cycle.getStartDate(), cycle.getEndDate()) + 1;

        Optional<KpiMidcycleFinalScore> compositeOpt = midcycleFinalScoreRepository.findByEmployee_IdAndCycle_CycleId(employeeId, cycleId);
        BigDecimal compositeScore = compositeOpt.map(KpiMidcycleFinalScore::getCompositeScore).orElse(null);

        boolean hasOpenPhase = phases.stream().anyMatch(p -> p.getStatus() == PhaseStatus.OPEN);

        List<MidcyclePhaseResponse> phaseResponses = new ArrayList<>();
        for (KpiGoalPhase phase : phases) {
            BigDecimal days = phase.getPhaseDays() != null ? BigDecimal.valueOf(phase.getPhaseDays()) : null;
            BigDecimal weight = phase.getPhaseWeight();
            if (weight == null && days != null) {
                weight = days.divide(BigDecimal.valueOf(totalCycleDays), 6, RoundingMode.HALF_UP);
            }

            BigDecimal score = phase.getPhaseScore();
            BigDecimal weightedContribution = null;
            if (score != null && weight != null) {
                weightedContribution = score.multiply(weight).setScale(4, RoundingMode.HALF_UP);
            }

            phaseResponses.add(MidcyclePhaseResponse.builder()
                    .phaseNumber(phase.getPhaseNumber())
                    .startDate(phase.getPhaseStartDate())
                    .endDate(phase.getPhaseEndDate())
                    .days(phase.getPhaseDays())
                    .weight(weight)
                    .score(score)
                    .weightedContribution(weightedContribution)
                    .goalSetId(phase.getGoalSet() != null ? phase.getGoalSet().getId() : null)
                    .status(phase.getStatus().name())
                    .changeReason(phase.getChangeReason())
                    .build());
        }

        return MidcycleSummaryResponse.builder()
                .employeeId(employeeId)
                .employeeName(employee.getStaffName())
                .cycleId(cycleId)
                .cycleName(cycle.getCycleName())
                .totalCycleDays(totalCycleDays)
                .hasOpenPhase(hasOpenPhase)
                .phases(phaseResponses)
                .compositeScore(compositeScore)
                .build();
    }

    @Override
    @Transactional
    public void linkGoalSetToOpenPhase(Long employeeId, Long cycleId, Long goalSetId) {
        Optional<KpiGoalPhase> openPhaseOpt = phaseRepository.findByEmployee_IdAndCycle_CycleIdAndStatus(employeeId, cycleId, PhaseStatus.OPEN);
        KpiGoals goalSet = goalsRepository.findById(goalSetId)
                .orElseThrow(() -> new NotFoundException("Goal set not found"));
        if (!goalSet.getEmployee().getId().equals(employeeId) || !goalSet.getCycle().getCycleId().equals(cycleId)) {
            return;
        }

        if (openPhaseOpt.isPresent()) {
            KpiGoalPhase openPhase = openPhaseOpt.get();
            if (openPhase.getGoalSet() == null) {
                openPhase.setGoalSet(goalSet);
                phaseRepository.save(openPhase);
            }
            return;
        }

        List<KpiGoalPhase> existingPhases = phaseRepository.findByEmployee_IdAndCycle_CycleIdOrderByPhaseNumberAsc(employeeId, cycleId);
        if (!existingPhases.isEmpty()) {
            createOpenPhaseAfterLatest(goalSet.getEmployee(), goalSet.getCycle(), goalSet, existingPhases);
        } else {
            phaseRepository.save(KpiGoalPhase.builder()
                .employee(goalSet.getEmployee())
                .cycle(goalSet.getCycle())
                .goalSet(goalSet)
                .phaseNumber(1)
                .phaseStartDate(goalSet.getCycle().getStartDate())
                .status(PhaseStatus.OPEN)
                .build());
        }
    }

    private Employee getCurrentEmployee() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return employeeRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Current user not found"));
    }

    private boolean canViewEmployeeSummary(Employee currentUser, Long targetEmployeeId) {
        if (currentUser.getId().equals(targetEmployeeId)) {
            return true;
        }

        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER")
                        || a.getAuthority().equals("ROLE_HR")
                        || a.getAuthority().equals("ROLE_ADMIN"));
    }

    private void ensureCycleAllowsMidcycleChange(AppraisalCycle cycle) {
        boolean active = Boolean.TRUE.equals(cycle.getIsActive());
        boolean allowedStatus = cycle.getStatus() == CycleStatus.PLANNING
                || cycle.getStatus() == CycleStatus.IN_PROGRESS
                || cycle.getStatus() == CycleStatus.EVALUATION;

        if (!active || !allowedStatus) {
            throw new IllegalStateException("Midcycle changes are only allowed for active appraisal cycles.");
        }
    }

    private KpiGoalPhase createOpenPhaseAfterLatest(
            Employee employee,
            AppraisalCycle cycle,
            KpiGoals goalSet,
            List<KpiGoalPhase> existingPhases) {

        KpiGoalPhase latestPhase = existingPhases.get(existingPhases.size() - 1);
        LocalDate nextStartDate = latestPhase.getPhaseEndDate() != null
                ? latestPhase.getPhaseEndDate().plusDays(1)
                : latestPhase.getPhaseStartDate();

        KpiGoalPhase recoveredPhase = KpiGoalPhase.builder()
                .employee(employee)
                .cycle(cycle)
                .goalSet(goalSet)
                .phaseNumber(latestPhase.getPhaseNumber() + 1)
                .phaseStartDate(nextStartDate)
                .status(PhaseStatus.OPEN)
                .build();

        return phaseRepository.save(recoveredPhase);
    }
}
