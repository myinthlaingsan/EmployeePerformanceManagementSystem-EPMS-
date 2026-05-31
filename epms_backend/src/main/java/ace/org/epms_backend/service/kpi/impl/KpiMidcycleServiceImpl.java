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
import ace.org.epms_backend.service.kpi.KpiPhaseLinkerService;
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
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class KpiMidcycleServiceImpl implements KpiMidcycleService {

    private final KpiGoalsRepository goalsRepository;
    private final ace.org.epms_backend.repository.KpiGoalItemRepository goalItemRepository;
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
    private final KpiPhaseLinkerService phaseLinkerService;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public void triggerMidcycleChange(MidcycleChangeRequest request) {
        LocalDateTime changeDate = request.getChangeDate();
        Long employeeId = request.getEmployeeId();
        Long cycleId = request.getCycleId();

        AppraisalCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new NotFoundException("Appraisal cycle not found"));

        ensureCycleAllowsMidcycleChange(cycle);

        LocalDateTime now = LocalDateTime.now();
        if (changeDate.isAfter(now)) {
            throw new IllegalArgumentException("Change date cannot be in the future. Latest allowed date is " + now);
        }

        LocalDateTime cycleStart = cycle.getStartDate().atStartOfDay();
        LocalDateTime cycleEnd = cycle.getEndDate().plusDays(1).atStartOfDay();
        if (changeDate.isBefore(cycleStart) || !changeDate.isBefore(cycleEnd)) {
            throw new IllegalArgumentException("Change date must be within the appraisal cycle period ("
                    + cycleStart + " - " + cycle.getEndDate().atTime(23, 59, 59) + ")");
        }

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        Employee currentUser = getCurrentEmployee();

        Optional<KpiGoalPhase> openPhaseOpt = phaseRepository.findByEmployee_IdAndCycle_CycleIdAndStatus(employeeId,
                cycleId, PhaseStatus.OPEN);

        KpiGoalPhase currentPhase;
        int nextPhaseNumber = 1;

        if (openPhaseOpt.isEmpty()) {
            KpiGoals currentGoalSet = goalsRepository
                    .findByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(employeeId, cycleId)
                    .orElseThrow(() -> new NotFoundException(
                            "No active goal set found for this employee and cycle. Please assign KPIs first."));

            List<KpiGoalPhase> existingPhases = phaseRepository
                    .findByEmployee_IdAndCycle_CycleIdOrderByPhaseNumberAsc(employeeId, cycleId);
            if (!existingPhases.isEmpty()) {
                currentPhase = createOpenPhaseAfterLatest(employee, cycle, currentGoalSet, existingPhases);
                nextPhaseNumber = currentPhase.getPhaseNumber() + 1;
            } else {
                currentPhase = KpiGoalPhase.builder()
                        .employee(employee)
                        .cycle(cycle)
                        .goalSet(currentGoalSet)
                        .phaseNumber(1)
                        .phaseStartDate(cycle.getStartDate().atStartOfDay())
                        .status(PhaseStatus.OPEN)
                        .build();

                nextPhaseNumber = 2;
            }
        } else {
            currentPhase = openPhaseOpt.get();
            nextPhaseNumber = currentPhase.getPhaseNumber() + 1;

            if (currentPhase.getGoalSet() == null) {
                throw new IllegalStateException(
                        "Cannot trigger midcycle change: No goal set has been assigned to the current phase yet.");
            }
        }

        if (!changeDate.isAfter(currentPhase.getPhaseStartDate())) {
            throw new IllegalArgumentException(
                    "Change date must be after current phase start date (" + currentPhase.getPhaseStartDate() + ")");
        }

        currentPhase.setPhaseEndDate(changeDate);
        int phaseDays = (int) ChronoUnit.DAYS.between(currentPhase.getPhaseStartDate().toLocalDate(), changeDate.toLocalDate()) + 1;
        currentPhase.setPhaseDays(Math.max(1, phaseDays));
        currentPhase.setChangeReason(request.getChangeReason());
        currentPhase.setTriggeredBy(currentUser.getId());

        KpiGoals goalSet = currentPhase.getGoalSet();
        if (goalSet.getStatus() == KpiGoalStatus.DRAFT) {
            throw new IllegalStateException(
                    "Goal set for the current phase is in DRAFT status. It must be approved before triggering a midcycle change.");
        }

        if (goalSet.getStatus() == KpiGoalStatus.APPROVED) {
            kpiGoalService.lockGoalSet(goalSet.getId());
        }

        // kpiScoringService.calculateFinalScore(employeeId, cycleId);

        // KpiFinalScore finalScore =
        // finalScoreRepository.findByEmployee_IdAndGoalSet_Cycle_CycleId(employeeId,
        // cycleId)
        // .orElseThrow(() -> new NotFoundException("Calculated final score not
        // found"));

        // currentPhase.setPhaseScore(finalScore.getWeightedScore());

        // Calculate phase score directly from goal set items (NO KpiFinalScore created)
        BigDecimal phaseScore = calculateWeightedScoreFromGoalSet(goalSet);
        currentPhase.setPhaseScore(phaseScore);

        currentPhase.setStatus(PhaseStatus.SCORED);

        phaseRepository.save(currentPhase);

        goalSet.setIsCurrent(false);
        goalsRepository.save(goalSet);

        KpiGoalPhase newPhase = KpiGoalPhase.builder()
                .employee(employee)
                .cycle(cycle)
                .phaseNumber(nextPhaseNumber)
                .phaseStartDate(changeDate)
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
                            + ". Please assign KPIs for the new phase starting on " + changeDate + ".")
                    .referenceType(ReferenceType.KPI)
                    .referenceId(goalSet.getId())
                    .actionUrl("/kpi/management")
                    .build());
        }

        historyRepo.save(KpiHistoryLog.builder()
                .employeeId(employee.getId())
                .goalSetId(goalSet.getId())
                .action("PHASE_CLOSED")
                .changeReason(request.getChangeReason())
                .changeDetails("Phase " + currentPhase.getPhaseNumber() + " closed on " + changeDate
                        + " with score " + currentPhase.getPhaseScore() + ".")
                .changedBy(currentUser.getId())
                .build());

        historyRepo.save(KpiHistoryLog.builder()
                .employeeId(employee.getId())
                .goalSetId(goalSet.getId())
                .action("PHASE_OPENED")
                .changeReason(request.getChangeReason())
                .changeDetails("Phase " + newPhase.getPhaseNumber() + " opened on " + newPhase.getPhaseStartDate()
                        + " and is waiting for KPI assignment.")
                .changedBy(currentUser.getId())
                .build());

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

        List<KpiGoalPhase> phases = phaseRepository.findByEmployee_IdAndCycle_CycleIdOrderByPhaseNumberAsc(employeeId,
                cycleId);

        if (phases.isEmpty()) {
            KpiGoals currentGoalSet = goalsRepository
                    .findByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(employeeId, cycleId)
                    .orElseThrow(() -> new IllegalStateException(
                            "No midcycle phases or active goal set found for this employee and cycle."));

            KpiGoalPhase defaultPhase = KpiGoalPhase.builder()
                    .employee(employee)
                    .cycle(cycle)
                    .goalSet(currentGoalSet)
                    .phaseNumber(1)
                    .phaseStartDate(cycle.getStartDate().atStartOfDay())
                    .status(PhaseStatus.OPEN)
                    .build();
            phases = List.of(phaseRepository.save(defaultPhase));
        }

        KpiGoalPhase lastPhase = phases.get(phases.size() - 1);
        if (lastPhase.getStatus() == PhaseStatus.OPEN) {
            LocalDateTime cycleEnd = cycle.getEndDate().plusDays(1).atStartOfDay();
            if (cycleEnd.isBefore(lastPhase.getPhaseStartDate())) {
                throw new IllegalStateException(
                        "Cannot finalize composite score: cycle end date is before the last phase start date.");
            }

            lastPhase.setPhaseEndDate(cycleEnd);
            int phaseDays = (int) ChronoUnit.DAYS.between(lastPhase.getPhaseStartDate().toLocalDate(), cycle.getEndDate()) + 1;
            lastPhase.setPhaseDays(Math.max(1, phaseDays));
            lastPhase.setChangeReason("Appraisal cycle end finalization");
            lastPhase.setTriggeredBy(currentUser.getId());

            KpiGoals goalSet = lastPhase.getGoalSet();
            if (goalSet == null) {
                throw new IllegalStateException(
                        "Cannot finalize composite score: The last phase does not have KPIs assigned.");
            }

            if (goalSet.getStatus() == KpiGoalStatus.DRAFT) {
                throw new IllegalStateException(
                        "The goal set for the final phase is in DRAFT status. It must be approved before finalization.");
            }

            if (goalSet.getStatus() == KpiGoalStatus.APPROVED) {
                kpiGoalService.lockGoalSet(goalSet.getId());
            }

            kpiScoringService.calculateFinalScore(employeeId, cycleId);

            KpiFinalScore finalScore = finalScoreRepository
                    .findByEmployee_IdAndGoalSet_Cycle_CycleId(employeeId, cycleId)
                    .orElseThrow(() -> new NotFoundException("Calculated final score for last phase not found"));

            lastPhase.setPhaseScore(finalScore.getWeightedScore());
            lastPhase.setStatus(PhaseStatus.SCORED);

            phaseRepository.save(lastPhase);

            goalSet.setIsCurrent(false);
            goalsRepository.save(goalSet);
        }

        int totalCycleDays = (int) ChronoUnit.DAYS.between(cycle.getStartDate(), cycle.getEndDate()) + 1;
        if (totalCycleDays <= 0) {
            throw new IllegalStateException(
                    "Cannot finalize composite score: cycle end date must be on or after cycle start date.");
        }
        BigDecimal totalWeightedScoreSum = BigDecimal.ZERO;
        BigDecimal totalAchievementPercentSum = BigDecimal.ZERO;

        long totalCycleMinutes = Duration.between(cycle.getStartDate().atStartOfDay(), cycle.getEndDate().plusDays(1).atStartOfDay()).toMinutes();
        if (totalCycleMinutes <= 0) {
            throw new IllegalStateException("Cannot finalize composite score: cycle duration must be positive.");
        }

        for (KpiGoalPhase phase : phases) {
            if (phase.getPhaseDays() == null || phase.getPhaseDays() <= 0) {
                throw new IllegalStateException(
                        "Cannot finalize composite score: phase " + phase.getPhaseNumber() + " has invalid duration.");
            }

            LocalDateTime phaseStart = phase.getPhaseStartDate();
            LocalDateTime phaseEnd = phase.getPhaseEndDate() != null
                    ? phase.getPhaseEndDate()
                    : cycle.getEndDate().plusDays(1).atStartOfDay();
            if (phaseEnd.isBefore(phaseStart)) {
                throw new IllegalStateException(
                        "Cannot finalize composite score: phase " + phase.getPhaseNumber() + " has invalid time range.");
            }
            long phaseMinutes = Duration.between(phaseStart, phaseEnd).toMinutes();
            BigDecimal weight = BigDecimal.valueOf(phaseMinutes).divide(BigDecimal.valueOf(totalCycleMinutes), 6, RoundingMode.HALF_UP);
            phase.setPhaseWeight(weight);
            phaseRepository.save(phase);

            BigDecimal score = phase.getPhaseScore() != null ? phase.getPhaseScore() : BigDecimal.ZERO;
            totalWeightedScoreSum = totalWeightedScoreSum.add(score.multiply(weight));

            TypedQuery<KpiFinalScore> query = entityManager.createQuery(
                    "SELECT f FROM KpiFinalScore f WHERE f.employee.id = :empId AND f.goalSet.id = :gsId",
                    KpiFinalScore.class);
            query.setParameter("empId", employeeId);
            query.setParameter("gsId", phase.getGoalSet().getId());
            List<KpiFinalScore> list = query.getResultList();
            KpiFinalScore phaseFinalScore = list.isEmpty() ? null : list.get(0);

            BigDecimal achievement = (phaseFinalScore != null && phaseFinalScore.getTotalAchievementPercent() != null)
                    ? phaseFinalScore.getTotalAchievementPercent()
                    : BigDecimal.ZERO;
            totalAchievementPercentSum = totalAchievementPercentSum.add(achievement.multiply(weight));
        }

        StringBuilder breakdownBuilder = new StringBuilder("[");
        for (int i = 0; i < phases.size(); i++) {
            KpiGoalPhase p = phases.get(i);
            breakdownBuilder.append(String.format(
                    "{\"phaseNumber\":%d,\"startDate\":\"%s\",\"endDate\":\"%s\",\"days\":%d,\"weight\":%s,\"score\":%s}",
                    p.getPhaseNumber(), p.getPhaseStartDate(), p.getPhaseEndDate(), p.getPhaseDays(),
                    p.getPhaseWeight(), p.getPhaseScore()));
            if (i < phases.size() - 1) {
                breakdownBuilder.append(",");
            }
        }
        breakdownBuilder.append("]");

        KpiMidcycleFinalScore midcycleScore = midcycleFinalScoreRepository
                .findByEmployee_IdAndCycle_CycleId(employeeId, cycleId)
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
        // KpiFinalScore finalScore =
        // finalScoreRepository.findByEmployee_IdAndGoalSet_Cycle_CycleId(employeeId,
        // cycleId)
        // .orElse(new KpiFinalScore());

        // finalScore.setEmployee(employee);
        // finalScore.setGoalSet(lastPhaseGoalSet);
        // finalScore.setWeightedScore(totalWeightedScoreSum.setScale(4,
        // RoundingMode.HALF_UP));
        // finalScore.setTotalAchievementPercent(totalAchievementPercentSum.setScale(2,
        // RoundingMode.HALF_UP));
        // finalScore.setCalculatedAt(Instant.now());
        // finalScore.setFinalizedBy(currentUser.getId());

        // Delete any existing KpiFinalScore to ensure only ONE record per
        // employee/cycle
        finalScoreRepository.findByEmployee_IdAndGoalSet_Cycle_CycleId(employeeId, cycleId)
                .ifPresent(existing -> {
                    finalScoreRepository.delete(existing);
                });

        // Create new composite final score
        KpiFinalScore finalScore = KpiFinalScore.builder()
                .employee(employee)
                .goalSet(lastPhaseGoalSet)
                .weightedScore(totalWeightedScoreSum.setScale(4, RoundingMode.HALF_UP))
                .totalAchievementPercent(totalAchievementPercentSum.setScale(2, RoundingMode.HALF_UP))
                .calculatedAt(Instant.now())
                .finalizedBy(currentUser.getId())
                .build();
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

        List<KpiGoalPhase> phases = phaseRepository.findByEmployee_IdAndCycle_CycleIdOrderByPhaseNumberAsc(employeeId,
                cycleId);

        int totalCycleDays = (int) ChronoUnit.DAYS.between(cycle.getStartDate(), cycle.getEndDate()) + 1;

        Optional<KpiMidcycleFinalScore> compositeOpt = midcycleFinalScoreRepository
                .findByEmployee_IdAndCycle_CycleId(employeeId, cycleId);
        BigDecimal compositeScore = compositeOpt.map(KpiMidcycleFinalScore::getCompositeScore).orElse(null);

        boolean hasOpenPhase = phases.stream().anyMatch(p -> p.getStatus() == PhaseStatus.OPEN);

        List<MidcyclePhaseResponse> phaseResponses = new ArrayList<>();
        for (KpiGoalPhase phase : phases) {
            BigDecimal days = phase.getPhaseDays() != null ? BigDecimal.valueOf(phase.getPhaseDays()) : null;
            BigDecimal weight = phase.getPhaseWeight();

            if (days == null) {
                LocalDateTime actualStartDate = phase.getPhaseStartDate() != null ? phase.getPhaseStartDate() : cycle.getStartDate().atStartOfDay();
                if (actualStartDate != null) {
                    LocalDateTime endDate = phase.getPhaseEndDate() != null
                            ? phase.getPhaseEndDate()
                            : cycle.getEndDate().plusDays(1).atStartOfDay();
                    if (phase.getStatus() == PhaseStatus.OPEN) {
                        if (!endDate.isBefore(actualStartDate)) {
                            days = BigDecimal.valueOf(ChronoUnit.DAYS.between(actualStartDate.toLocalDate(), endDate.toLocalDate()) + 1);
                        }
                    } else if (phase.getPhaseEndDate() != null) {
                        days = BigDecimal.valueOf(ChronoUnit.DAYS.between(actualStartDate.toLocalDate(), phase.getPhaseEndDate().toLocalDate()) + 1);
                    }
                }
            }

            if (weight == null && days != null) {
                weight = days.divide(BigDecimal.valueOf(totalCycleDays), 6, RoundingMode.HALF_UP);
            }

            BigDecimal score = phase.getPhaseScore();
            if (phase.getStatus() == PhaseStatus.OPEN) {
                if (score == null) {
                    if (phase.getGoalSet() != null) {
                        score = calculateWeightedScoreFromGoalSet(phase.getGoalSet());
                    } else {
                        java.util.Optional<KpiGoals> currentGoalSetOpt = goalsRepository.findByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(employeeId, cycleId);
                        if (currentGoalSetOpt.isPresent()) {
                            score = calculateWeightedScoreFromGoalSet(currentGoalSetOpt.get());
                        }
                    }
                }
            } else {
                if (score == null && phase.getGoalSet() != null) {
                    score = calculateWeightedScoreFromGoalSet(phase.getGoalSet());
                }
            }
            BigDecimal weightedContribution = null;
            if (score != null && weight != null) {
                weightedContribution = score.multiply(weight).setScale(4, RoundingMode.HALF_UP);
            }

            phaseResponses.add(MidcyclePhaseResponse.builder()
                    .phaseNumber(phase.getPhaseNumber())
                    .startDate(phase.getPhaseStartDate())
                    .endDate(phase.getPhaseEndDate())
                    .days(days != null ? days.intValue() : null)
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
        Optional<KpiGoalPhase> openPhaseOpt = phaseRepository.findByEmployee_IdAndCycle_CycleIdAndStatus(employeeId,
                cycleId, PhaseStatus.OPEN);
        KpiGoals goalSet = goalsRepository.findById(goalSetId)
                .orElseThrow(() -> new NotFoundException("Goal set not found"));
        if (!goalSet.getEmployee().getId().equals(employeeId) || !goalSet.getCycle().getCycleId().equals(cycleId)) {
            return;
        }

        if (openPhaseOpt.isPresent()) {
            KpiGoalPhase openPhase = openPhaseOpt.get();
            // Always link to the latest goal set
            if (true) {
                openPhase.setGoalSet(goalSet);
                phaseRepository.save(openPhase);
            }
            return;
        }

        List<KpiGoalPhase> existingPhases = phaseRepository
                .findByEmployee_IdAndCycle_CycleIdOrderByPhaseNumberAsc(employeeId, cycleId);
        if (!existingPhases.isEmpty()) {
            createOpenPhaseAfterLatest(goalSet.getEmployee(), goalSet.getCycle(), goalSet, existingPhases);
        } else {
            phaseRepository.save(KpiGoalPhase.builder()
                    .employee(goalSet.getEmployee())
                    .cycle(goalSet.getCycle())
                    .goalSet(goalSet)
                    .phaseNumber(1)
                    .phaseStartDate(goalSet.getCycle().getStartDate().atStartOfDay())
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
        LocalDateTime nextStartDate = latestPhase.getPhaseEndDate() != null
                ? latestPhase.getPhaseEndDate()
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

    /**
     * Calculates the total weighted score directly from a goal set's items.
     * This is used for phase scores and does NOT create KpiFinalScore records.
     * 
     * @param goalSet the goal set to calculate score for
     * @return the total weighted score (sum of weightedScore from all active items)
     */
    private BigDecimal calculateWeightedScoreFromGoalSet(KpiGoals goalSet) {
        if (goalSet == null) {
            return BigDecimal.ZERO;
        }
        return goalItemRepository.findByGoalSetIdAndIsActiveTrue(goalSet.getId()).stream()
                .filter(item -> Boolean.TRUE.equals(item.getIsActive()))
                .map(item -> item.getWeightedScore() != null ? item.getWeightedScore() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
