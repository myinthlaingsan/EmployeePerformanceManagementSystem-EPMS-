package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.dashboard.*;
import ace.org.epms_backend.enums.AppraisalStatus;
import ace.org.epms_backend.enums.KpiItemStatus;
import ace.org.epms_backend.enums.RoleType;
import ace.org.epms_backend.enums.PipStatus;
import ace.org.epms_backend.enums.ContinuousStatus;
import ace.org.epms_backend.model.appraisal.Appraisal;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.appraisal.AppraisalSummary;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.ReportingLine;
import ace.org.epms_backend.model.kpi.KpiGoals;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.repository.employee.ReportingLineRepository;
import ace.org.epms_backend.repository.employee.TeamRepository;
import ace.org.epms_backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final TeamRepository teamRepository;
    private final AppraisalRepository appraisalRepository;
    private final AppraisalCycleRepository appraisalCycleRepository;
    private final PipRecordRepository pipRecordRepository;
    private final SelfAssessmentRepository selfAssessmentRepository;
    private final ManagerEvaluationRepository managerEvaluationRepository;
    private final AppraisalSummaryRepository appraisalSummaryRepository;
    private final KpiGoalsRepository kpiGoalsRepository;
    private final NotificationRepository notificationRepository;
    private final ReportingLineRepository reportingLineRepository;
    private final AuditLogRepository auditLogRepository;
    private final EmployeeDepartmentRepository employeeDepartmentRepository;
    private final EmployeeRoleRepository employeeRoleRepository;
    private final ContinuousFeedbackRepository continuousFeedbackRepository;
    private final OneOnOneMeetingRepository oneOnOneMeetingRepository;

    @Override
    public HrDashboardResponse getHrDashboard() {
        AppraisalCycle currentCycle = appraisalCycleRepository.findByIsActiveTrueOrderByCycleIdDesc().stream().findFirst().orElse(null);
        long cycleId = currentCycle != null ? currentCycle.getCycleId() : 0L;

        List<Appraisal> appraisals = appraisalRepository.findByCycle_CycleId(cycleId);
        long totalUnderReview = appraisals.size();
        long completed = appraisals.stream().filter(a -> a.getStatus() == AppraisalStatus.FINALIZED).count();
        double completionRate = totalUnderReview > 0 ? (double) completed / totalUnderReview * 100 : 0;

        List<AppraisalSummary> summaries = appraisalSummaryRepository.findByCycle_CycleId(cycleId);
        
        List<HrDashboardResponse.DepartmentPerformance> deptPerformance = departmentRepository.findAll().stream()
                .map(dept -> {
                    List<Long> employeeIdsInDept = employeeDepartmentRepository.findByCurrentDepartmentIdAndIsCurrentTrue(dept.getId())
                            .stream().map(ed -> ed.getEmployee().getId()).collect(Collectors.toList());

                    double avg = summaries.stream()
                            .filter(s -> employeeIdsInDept.contains(s.getEmployee().getId()))
                            .mapToDouble(s -> s.getTotalScore().doubleValue())
                            .average().orElse(0.0);
                    return HrDashboardResponse.DepartmentPerformance.builder()
                            .departmentName(dept.getDepartmentName())
                            .averageScore(Math.round(avg * 10.0) / 10.0)
                            .employeeCount(employeeIdsInDept.size())
                            .build();
                })
                .filter(dp -> dp.getEmployeeCount() > 0)
                .collect(Collectors.toList());

        List<HrDashboardResponse.TopPerformer> topPerformers = summaries.stream()
                .sorted((a, b) -> b.getTotalScore().compareTo(a.getTotalScore()))
                .limit(5)
                .map(s -> {
                    String deptName = employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(s.getEmployee().getId())
                            .map(ed -> ed.getCurrentDepartment().getDepartmentName()).orElse("N/A");
                    return HrDashboardResponse.TopPerformer.builder()
                            .employeeName(s.getEmployee().getStaffName())
                            .department(deptName)
                            .score(s.getTotalScore().doubleValue())
                            .build();
                })
                .collect(Collectors.toList());

        // Fix: Build alerts dynamically from real conditions
        List<HrDashboardResponse.DashboardAlert> alerts = new ArrayList<>();
        if (currentCycle != null) {
            LocalDate today = LocalDate.now();
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM d, yyyy");

            // Alert 1: Cycle ending within 7 days
            long daysLeft = ChronoUnit.DAYS.between(today, currentCycle.getEndDate());
            if (daysLeft <= 7 && daysLeft >= 0) {
                alerts.add(HrDashboardResponse.DashboardAlert.builder()
                    .title("Cycle Ending Soon")
                    .message("The appraisal cycle ends on " + currentCycle.getEndDate().format(fmt)
                        + " (" + daysLeft + " days left).")
                    .type(daysLeft <= 3 ? "danger" : "warning")
                    .timestamp(today.format(fmt))
                    .build());
            }

            // Alert 2: Low completion rate
            if (completionRate < 50.0) {
                alerts.add(HrDashboardResponse.DashboardAlert.builder()
                    .title("Low Appraisal Completion")
                    .message(String.format("Only %.0f%% of appraisals are completed. Follow up with managers.", completionRate))
                    .type("danger")
                    .timestamp(today.format(fmt))
                    .build());
            }

            // Alert 3: Pending self-assessments
            long pendingSelfAssessments = appraisals.stream()
                    .filter(a -> a.getStatus() == AppraisalStatus.PENDING).count();
            if (pendingSelfAssessments > 0) {
                alerts.add(HrDashboardResponse.DashboardAlert.builder()
                    .title("Pending Self-Assessments")
                    .message(pendingSelfAssessments + " employees have not submitted self-assessments.")
                    .type("warning")
                    .timestamp(today.format(fmt))
                    .build());
            }

            // Alert 4: Open PIPs
            long openPips = pipRecordRepository.count();
            if (openPips > 0) {
                alerts.add(HrDashboardResponse.DashboardAlert.builder()
                    .title("Active PIPs")
                    .message(openPips + " employees are currently on a Performance Improvement Plan.")
                    .type("info")
                    .timestamp(today.format(fmt))
                    .build());
            }
        }

        // Calculate new HR fields
        String currentCyclePhase = "PENDING";
        Double cyclePhaseProgress = 0.0;
        List<String> nonCompliantManagers = new ArrayList<>();
        Map<String, HrDashboardResponse.PipSummary> pipByDepartment = new HashMap<>();
        Long daysUntilCycleEnd = 0L;

        if (currentCycle != null) {
            daysUntilCycleEnd = ChronoUnit.DAYS.between(LocalDate.now(), currentCycle.getEndDate());

            // Derive current phase
            LocalDate today = LocalDate.now();
            if (!today.isBefore(currentCycle.getStartDate()) && !today.isAfter(currentCycle.getSelfAssessmentDeadline())) {
                currentCyclePhase = "SELF_ASSESSMENT";
                long total = employeeRepository.count();
                long done = selfAssessmentRepository.countByAppraisal_Cycle_CycleId(cycleId);
                cyclePhaseProgress = total > 0 ? (done * 100.0 / total) : 0.0;
            } else if (!today.isBefore(currentCycle.getSelfAssessmentDeadline()) && !today.isAfter(currentCycle.getManagerEvaluationDeadline())) {
                currentCyclePhase = "MANAGER_REVIEW";
                long total = employeeRepository.count();
                long done = managerEvaluationRepository.countByAppraisal_Cycle_CycleId(cycleId);
                cyclePhaseProgress = total > 0 ? (done * 100.0 / total) : 0.0;
            } else {
                currentCyclePhase = "FINALIZATION";
                cyclePhaseProgress = completionRate;
            }

            // Non-compliant managers (no evaluations submitted)
            List<Long> allManagerIds = employeeRoleRepository.findUserIdsByRole(RoleType.MANAGER);
            List<Long> submittedManagerIds = managerEvaluationRepository.findDistinctManagerIdsByCycleId(cycleId);
            nonCompliantManagers = allManagerIds.stream()
                    .filter(id -> !submittedManagerIds.contains(id))
                    .map(id -> employeeRepository.findById(id).map(Employee::getStaffName).orElse("Unknown"))
                    .collect(Collectors.toList());
        }

        // PIPs by department
        pipRecordRepository.findAll().forEach(pip -> {
            String dept = employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(pip.getEmployee().getId())
                    .map(ed -> ed.getCurrentDepartment().getDepartmentName()).orElse("Unknown");
            HrDashboardResponse.PipSummary summary = pipByDepartment.computeIfAbsent(dept, k -> new HrDashboardResponse.PipSummary());
            if (PipStatus.ACTIVE == pip.getStatus()) {
                summary.setActive(summary.getActive() + 1);
            } else {
                summary.setClosed(summary.getClosed() + 1);
            }
        });

        return HrDashboardResponse.builder()
                .totalEmployeesUnderReview(totalUnderReview)
                .appraisalCompletionRate(Math.round(completionRate * 10.0) / 10.0)
                .pendingSelfAssessments(appraisals.stream().filter(a -> a.getStatus() == AppraisalStatus.PENDING).count())
                .pendingManagerReviews(appraisals.stream().filter(a -> a.getStatus() == AppraisalStatus.SELF_ASSESSED).count())
                .openPips(pipRecordRepository.count())
                .promotionCandidates(summaries.stream().filter(s -> s.getTotalScore().doubleValue() > 90).count())
                .departmentPerformance(deptPerformance)
                .topPerformers(topPerformers)
                .alerts(alerts)
                .currentCyclePhase(currentCyclePhase)
                .cyclePhaseProgress(cyclePhaseProgress)
                .nonCompliantManagers(nonCompliantManagers)
                .pipByDepartment(pipByDepartment)
                .daysUntilCycleEnd(daysUntilCycleEnd)
                .build();
    }

    @Override
    public AdminDashboardResponse getAdminDashboard() {
        List<AppraisalCycle> cycles = appraisalCycleRepository.findByIsActiveTrueOrderByCycleIdDesc();

        // Fix: Query security-relevant audit logs
        List<AdminDashboardResponse.SecurityAlert> securityAlerts = auditLogRepository
                .findTop10ByTableNameOrderByChangedAtDesc("employees").stream()
                .map(log -> {
                    AdminDashboardResponse.SecurityAlert sa = new AdminDashboardResponse.SecurityAlert();
                    sa.setEvent(log.getAction() != null ? log.getAction().name() : "UNKNOWN");
                    sa.setSeverity(mapSecuritySeverity(log.getAction() != null ? log.getAction().name() : "UNKNOWN"));
                    sa.setTimestamp(log.getChangedAt() != null ? log.getChangedAt().toString() : "N/A");
                    sa.setDetails(log.getTableName());
                    return sa;
                })
                .collect(Collectors.toList());

        // Calculate new Admin fields
        java.time.Instant yesterday = java.time.Instant.now().minus(24, java.time.temporal.ChronoUnit.HOURS);
        java.time.Instant monthStart = java.time.LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).atZone(java.time.ZoneId.systemDefault()).toInstant();

        long failedLoginsLast24h = auditLogRepository.countByTableNameAndChangedAtAfter("employees", yesterday);
        long accountsCreatedThisMonth = auditLogRepository.countByTableNameAndChangedAtAfter("employees", monthStart);
        long accountsDeactivatedThisMonth = accountsCreatedThisMonth; // Simplified - would need separate table

        String activeCycleName = "";
        String cycleStartDate = "";
        String cycleEndDate = "";
        if (!cycles.isEmpty()) {
            AppraisalCycle activeCycle = cycles.get(0);
            activeCycleName = activeCycle.getCycleName();
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM d, yyyy");
            cycleStartDate = activeCycle.getStartDate().format(fmt);
            cycleEndDate = activeCycle.getEndDate().format(fmt);
        }

        return AdminDashboardResponse.builder()
                .totalEmployees(employeeRepository.count())
                .totalDepartments(departmentRepository.count())
                .totalManagers(employeeRoleRepository.countByRole_RoleName(RoleType.MANAGER))
                .activeUsers(employeeRepository.countByIsActiveTrue())
                .lockedAccounts(employeeRepository.countByAccountLockedTrue())
                .activeCycles(cycles.size())
                .recentActivities(auditLogRepository.findAll().stream()
                        .sorted((a, b) -> b.getChangedAt().compareTo(a.getChangedAt()))
                        .limit(5)
                        .map(log -> AdminDashboardResponse.RecentActivity.builder()
                                .action(log.getAction() != null ? log.getAction().name() : "UNKNOWN")
                                .user(log.getChangedBy() != null ? log.getChangedBy().getStaffName() : "System")
                                .module(log.getTableName())
                                .timestamp(log.getChangedAt() != null ? log.getChangedAt().toString() : "N/A")
                                .build())
                        .collect(Collectors.toList()))
                .securityAlerts(securityAlerts)
                .failedLoginsLast24h(failedLoginsLast24h)
                .accountsCreatedThisMonth(accountsCreatedThisMonth)
                .accountsDeactivatedThisMonth(accountsDeactivatedThisMonth)
                .activeCycleName(activeCycleName)
                .cycleStartDate(cycleStartDate)
                .cycleEndDate(cycleEndDate)
                .build();
    }

    @Override
    public EmployeeDashboardResponse getEmployeeDashboard(Long employeeId) {
        AppraisalCycle cycle = appraisalCycleRepository.findByIsActiveTrueOrderByCycleIdDesc().stream().findFirst().orElse(null);
        Long cycleId = cycle != null ? cycle.getCycleId() : 0L;

        AppraisalSummary summary = appraisalSummaryRepository.findByEmployee_IdAndCycle_CycleId(employeeId, cycleId).orElse(null);
        
        List<EmployeeDashboardResponse.ScoreTrend> trend = appraisalSummaryRepository.findByEmployee_Id(employeeId).stream()
                .map(s -> EmployeeDashboardResponse.ScoreTrend.builder()
                        .period(s.getCycle().getCycleName())
                        .score(s.getTotalScore().doubleValue())
                        .build())
                .collect(Collectors.toList());

        List<KpiGoals> kpiGoals = kpiGoalsRepository.findAllByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(employeeId, cycleId);
        double kpiCompletion = kpiGoals.stream()
                .flatMap(g -> g.getItems().stream())
                .mapToDouble(i -> i.getStatus() == KpiItemStatus.COMPLETED ? 100 : (i.getStatus() == KpiItemStatus.IN_PROGRESS ? 50 : 0))
                .average().orElse(0.0);

        // Fix: Count feedback from manager evaluations
        long feedbackCount = managerEvaluationRepository
                .countByAppraisal_Employee_IdAndAppraisal_Cycle_CycleId(employeeId, cycleId);

        // Fix: Build appraisal timeline from cycle phases
        List<EmployeeDashboardResponse.UpcomingPhase> timeline = new ArrayList<>();
        if (cycle != null) {
            LocalDate today = LocalDate.now();
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM d");

            // Phase 1: Self Assessment
            boolean selfDone = selfAssessmentRepository
                    .existsByAppraisal_Employee_IdAndAppraisal_Cycle_CycleId(employeeId, cycleId);
            timeline.add(EmployeeDashboardResponse.UpcomingPhase.builder()
                    .phase("Self Assessment")
                    .status(deriveStatus(today, cycle.getStartDate(), cycle.getSelfAssessmentDeadline(), selfDone))
                    .date(cycle.getSelfAssessmentDeadline().format(fmt))
                    .active(isActive(today, cycle.getStartDate(), cycle.getSelfAssessmentDeadline()))
                    .build());

            // Phase 2: Manager Review
            boolean managerDone = managerEvaluationRepository
                    .existsByAppraisal_Employee_IdAndAppraisal_Cycle_CycleId(employeeId, cycleId);
            timeline.add(EmployeeDashboardResponse.UpcomingPhase.builder()
                    .phase("Manager Review")
                    .status(deriveStatus(today, cycle.getSelfAssessmentDeadline(), cycle.getManagerEvaluationDeadline(), managerDone))
                    .date(cycle.getManagerEvaluationDeadline().format(fmt))
                    .active(isActive(today, cycle.getSelfAssessmentDeadline(), cycle.getManagerEvaluationDeadline()))
                    .build());

            // Phase 3: Final Appraisal
            timeline.add(EmployeeDashboardResponse.UpcomingPhase.builder()
                    .phase("Final Appraisal")
                    .status(deriveStatus(today, cycle.getManagerEvaluationDeadline(), cycle.getFinalizationDeadline(), summary != null))
                    .date(cycle.getFinalizationDeadline().format(fmt))
                    .active(isActive(today, cycle.getManagerEvaluationDeadline(), cycle.getFinalizationDeadline()))
                    .build());
        }

        // Populate new Employee fields
        Double managerLastScore = null;
        String managerLastComment = null;
        var lastEvaluation = managerEvaluationRepository.findTopByAppraisal_Employee_IdOrderByCreatedAtDesc(employeeId);
        if (lastEvaluation.isPresent()) {
            var eval = lastEvaluation.get();
            managerLastScore = eval.getTotalScore() != null ? eval.getTotalScore().doubleValue() : null;
            managerLastComment = eval.getFinalComment();
        }

        // Days until next deadline
        Long daysUntilNextDeadline = null;
        if (cycle != null) {
            LocalDate today = LocalDate.now();
            daysUntilNextDeadline = Stream.of(cycle.getSelfAssessmentDeadline(), cycle.getManagerEvaluationDeadline(), cycle.getFinalizationDeadline())
                    .filter(d -> !d.isBefore(today))
                    .mapToLong(d -> ChronoUnit.DAYS.between(today, d))
                    .min().orElse(-1L);
        }

        // Team rank
        Integer teamRank = null;
        Integer teamSize = null;
        Employee employee = employeeRepository.findById(employeeId).orElse(null);
        if (employee != null) {
            List<AppraisalSummary> teamSummaries = appraisalSummaryRepository.findByCycle_CycleId(cycleId);
            teamSummaries.sort(Comparator.comparingDouble((AppraisalSummary s) -> s.getTotalScore() != null ? s.getTotalScore().doubleValue() : 0.0).reversed());

            int rank = IntStream.range(0, teamSummaries.size())
                    .filter(i -> teamSummaries.get(i).getEmployee() != null && teamSummaries.get(i).getEmployee().getId().equals(employeeId))
                    .findFirst().orElse(-1) + 1;
            teamRank = rank > 0 ? rank : null;
            teamSize = teamSummaries.size();
        }

        // PIP status
        Boolean onPip = pipRecordRepository.existsByEmployeeIdAndStatus(employeeId, PipStatus.ACTIVE);

        return EmployeeDashboardResponse.builder()
                .currentScore(summary != null ? summary.getTotalScore().doubleValue() : 0.0)
                .kpiCompletionPercentage((int) kpiCompletion)
                .pendingTasksCount((int) notificationRepository.countByRecipientIdAndReadAtIsNullAndIsDeletedFalse(employeeId))
//                .feedbackCount((int) feedbackCount)
                .feedbackCount((int) continuousFeedbackRepository.countByEmployee_IdAndStatus(employeeId, ContinuousStatus.PUBLISHED))
                .performanceTrend(trend)
                .kpiStatus(List.of(
                    EmployeeDashboardResponse.KpiProgress.builder().name("Completed").value((int) kpiGoals.stream().flatMap(g -> g.getItems().stream()).filter(i -> i.getStatus() == KpiItemStatus.COMPLETED).count()).build(),
                    EmployeeDashboardResponse.KpiProgress.builder().name("Ongoing").value((int) kpiGoals.stream().flatMap(g -> g.getItems().stream()).filter(i -> i.getStatus() != KpiItemStatus.COMPLETED).count()).build()
                ))
                .appraisalTimeline(timeline)
                .tasks(notificationRepository.findByRecipientIdAndReadAtIsNullAndIsDeletedFalseOrderByCreatedAtDesc(employeeId).stream()
                        .limit(5)
                        .map(n -> {
                            String deadline = "No deadline";
                            if (cycle != null) {
                                deadline = cycle.getFinalizationDeadline() != null
                                    ? cycle.getFinalizationDeadline().format(DateTimeFormatter.ofPattern("MMM d"))
                                    : "ASAP";
                            }
                            return EmployeeDashboardResponse.DashboardTask.builder()
                                    .id(n.getId())
                                    .title(n.getMessage())
                                    .deadline(deadline)
                                    .priority("Normal")
                                    .build();
                        })
                        .collect(Collectors.toList()))
                .managerLastScore(managerLastScore)
                .managerLastComment(managerLastComment)
                .daysUntilNextDeadline(daysUntilNextDeadline)
                .teamRank(teamRank)
                .teamSize(teamSize)
                .onPip(onPip)
                .build();
    }

    @Override
    public ManagerDashboardResponse getManagerDashboard(Long managerId) {
        Employee manager = employeeRepository.findById(managerId).orElse(null);
        List<Employee> subordinates = reportingLineRepository.findAllByManagerAndIsActiveTrue(manager).stream()
                .map(ReportingLine::getEmployee)
                .collect(Collectors.toList());

        AppraisalCycle cycle = appraisalCycleRepository.findByIsActiveTrueOrderByCycleIdDesc().stream().findFirst().orElse(null);
        Long cycleId = cycle != null ? cycle.getCycleId() : 0L;

        List<Appraisal> teamAppraisals = appraisalRepository.findByManager_IdAndStatusIn(managerId, List.of(AppraisalStatus.values()));
        long completed = teamAppraisals.stream().filter(a -> a.getStatus() == AppraisalStatus.FINALIZED && a.getCycle().getCycleId().equals(cycleId)).count();

        // Fix: Count feedback requests - pending evaluations for this manager
        long submitted = managerEvaluationRepository
                .countByAppraisal_Manager_IdAndAppraisal_Cycle_CycleId(managerId, cycleId);
        long feedbackRequests = subordinates.size() - submitted;

        // Fix: Populate urgentReviews with overdue reviews
        List<EmployeeDashboardResponse.DashboardTask> urgentReviews = new ArrayList<>();
        if (cycle != null) {
            LocalDate urgentThreshold = LocalDate.now().plusDays(3);
            List<Long> submittedEmployeeIds = managerEvaluationRepository
                    .findEmployeeIdsByManagerIdAndCycleId(managerId, cycleId);

            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM d");
            urgentReviews = subordinates.stream()
                    .filter(emp -> !submittedEmployeeIds.contains(emp.getId()))
                    .filter(emp -> !cycle.getManagerEvaluationDeadline().isAfter(urgentThreshold))
                    .map(emp -> EmployeeDashboardResponse.DashboardTask.builder()
                            .id(emp.getId())
                            .title("Review: " + emp.getStaffName())
                            .deadline(cycle.getManagerEvaluationDeadline().format(fmt))
                            .priority(LocalDate.now().isAfter(cycle.getManagerEvaluationDeadline())
                                ? "Overdue" : "High")
                            .build())
                    .collect(Collectors.toList());
        }

        // Calculate new Manager fields
        List<AppraisalSummary> teamSummaries = appraisalSummaryRepository.findByCycle_CycleId(cycleId);
        double teamAvgScore = teamSummaries.stream()
                .filter(s -> subordinates.stream().anyMatch(e -> e.getId().equals(s.getEmployee().getId())))
                .mapToDouble(s -> s.getTotalScore() != null ? s.getTotalScore().doubleValue() : 0.0)
                .average().orElse(0.0);

        List<AppraisalSummary> companyAllSummaries = appraisalSummaryRepository.findByCycle_CycleId(cycleId);
        double companyAvgScore = companyAllSummaries.stream()
                .mapToDouble(s -> s.getTotalScore() != null ? s.getTotalScore().doubleValue() : 0.0)
                .average().orElse(0.0);

        // Pending self-assessments
        List<Long> submittedSAIds = selfAssessmentRepository.findEmployeeIdsByCycleId(cycleId);
        List<String> pendingSelfAssessmentNames = subordinates.stream()
                .filter(emp -> !submittedSAIds.contains(emp.getId()))
                .map(Employee::getStaffName)
                .collect(Collectors.toList());

        // At-risk employees (score dropped > 10 pts)
        AppraisalCycle previousCycle = appraisalCycleRepository.findAllByOrderByEndDateDesc().stream()
                .skip(1).findFirst().orElse(null);
        List<ManagerDashboardResponse.AtRiskEmployee> atRiskEmployees = new ArrayList<>();
        if (previousCycle != null) {
            atRiskEmployees = subordinates.stream()
                    .map(emp -> {
                        Double curr = appraisalSummaryRepository.findByEmployee_IdAndCycle_CycleId(emp.getId(), cycleId)
                                .map(s -> s.getTotalScore().doubleValue()).orElse(null);
                        Double prev = appraisalSummaryRepository.findByEmployee_IdAndCycle_CycleId(emp.getId(), previousCycle.getCycleId())
                                .map(s -> s.getTotalScore().doubleValue()).orElse(null);
                        if (curr != null && prev != null && (prev - curr) > 10) {
                            return ManagerDashboardResponse.AtRiskEmployee.builder()
                                    .name(emp.getStaffName())
                                    .currentScore(curr)
                                    .previousScore(prev)
                                    .delta(curr - prev)
                                    .build();
                        }
                        return null;
                    })
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        }

        // Overdue reviews
        List<ManagerDashboardResponse.OverdueReview> overdueReviews = new ArrayList<>();
        if (cycle != null) {
            List<Long> submittedEmployeeIds = managerEvaluationRepository
                    .findEmployeeIdsByManagerIdAndCycleId(managerId, cycleId);
            LocalDate today = LocalDate.now();
            overdueReviews = subordinates.stream()
                    .filter(emp -> !submittedEmployeeIds.contains(emp.getId()))
                    .filter(emp -> today.isAfter(cycle.getManagerEvaluationDeadline()))
                    .map(emp -> ManagerDashboardResponse.OverdueReview.builder()
                            .employeeId(emp.getId())
                            .employeeName(emp.getStaffName())
                            .daysOverdue(ChronoUnit.DAYS.between(cycle.getManagerEvaluationDeadline(), today))
                            .build())
                    .collect(Collectors.toList());
        }

        return ManagerDashboardResponse.builder()
                .teamSize(subordinates.size())
                .reviewsCompleted((int) completed)
                .totalReviews(subordinates.size())
                .pendingReviews((int) (subordinates.size() - completed))
//              .feedbackRequests((int) feedbackRequests)
                .feedbackRequests((int) continuousFeedbackRepository.countByManager_IdAndStatus(managerId, ContinuousStatus.DRAFT))
                .teamAvgScore(teamAvgScore)
                .companyAvgScore(companyAvgScore)
                .pendingSelfAssessmentNames(pendingSelfAssessmentNames)
                .atRiskEmployees(atRiskEmployees)
                .overdueReviews(overdueReviews)
                .teamPerformance(subordinates.stream()
                        .map(e -> {
                            double score = appraisalSummaryRepository.findByEmployee_IdAndCycle_CycleId(e.getId(), cycleId)
                                    .map(s -> s.getTotalScore().doubleValue()).orElse(0.0);
                            return ManagerDashboardResponse.TeamMemberPerformance.builder()
                                    .name(e.getStaffName())
                                    .score(score)
                                    .build();
                        })
                        .collect(Collectors.toList()))
                .teamKpis(kpiGoalsRepository.findTeamGoals(managerId, cycleId).stream()
                        .flatMap(g -> g.getItems().stream())
                        .collect(Collectors.groupingBy(i -> i.getTitle()))
                        .entrySet().stream()
                        .limit(4)
                        .map(entry -> {
                            double avg = entry.getValue().stream()
                                    .mapToDouble(i -> i.getStatus() == KpiItemStatus.COMPLETED ? 100 : (i.getStatus() == KpiItemStatus.IN_PROGRESS ? 50 : 0))
                                    .average().orElse(0.0);
                            return ManagerDashboardResponse.TeamKpiProgress.builder()
                                    .name(entry.getKey())
                                    .progress((int) avg)
                                    .color(kpiColor((int) avg))
                                    .build();
                        })
                        .collect(Collectors.toList()))
                .urgentReviews(urgentReviews)
                .build();
    }

    private String deriveStatus(LocalDate today, LocalDate start, LocalDate end, boolean done) {
        if (done) return "Completed";
        if (today.isBefore(start)) return "Upcoming";
        if (!today.isAfter(end)) return "In Progress";
        return "Overdue";
    }

    private boolean isActive(LocalDate today, LocalDate start, LocalDate end) {
        return !today.isBefore(start) && !today.isAfter(end);
    }

    private String kpiColor(int progress) {
        if (progress >= 80) return "green";
        if (progress >= 65) return "blue";
        if (progress >= 50) return "orange";
        return "red";
    }

    private String mapSecuritySeverity(String eventType) {
        return switch (eventType) {
            case "DELETE" -> "HIGH";
            case "UPDATE" -> "MEDIUM";
            default -> "LOW";
        };
    }
}
