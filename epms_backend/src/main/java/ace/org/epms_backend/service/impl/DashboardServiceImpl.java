package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.dashboard.*;
import ace.org.epms_backend.enums.AppraisalStatus;
import ace.org.epms_backend.enums.KpiItemStatus;
import ace.org.epms_backend.enums.RoleType;
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

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

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

        return HrDashboardResponse.builder()
                .totalEmployeesUnderReview(totalUnderReview)
                .appraisalCompletionRate(Math.round(completionRate * 10.0) / 10.0)
                .pendingSelfAssessments(appraisals.stream().filter(a -> a.getStatus() == AppraisalStatus.PENDING).count())
                .pendingManagerReviews(appraisals.stream().filter(a -> a.getStatus() == AppraisalStatus.SELF_ASSESSED).count())
                .openPips(pipRecordRepository.count())
                .promotionCandidates(summaries.stream().filter(s -> s.getTotalScore().doubleValue() > 90).count())
                .departmentPerformance(deptPerformance)
                .topPerformers(topPerformers)
                .alerts(List.of(
                    HrDashboardResponse.DashboardAlert.builder()
                        .title("Cycle Ending")
                        .message("The current appraisal cycle ends in " + (currentCycle != null ? currentCycle.getEndDate() : "N/A"))
                        .type("warning")
                        .timestamp("Recently")
                        .build()
                ))
                .build();
    }

    @Override
    public AdminDashboardResponse getAdminDashboard() {
        List<AppraisalCycle> cycles = appraisalCycleRepository.findByIsActiveTrueOrderByCycleIdDesc();
        
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
                .securityAlerts(new ArrayList<>())
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

        return EmployeeDashboardResponse.builder()
                .currentScore(summary != null ? summary.getTotalScore().doubleValue() : 0.0)
                .kpiCompletionPercentage((int) kpiCompletion)
                .pendingTasksCount((int) notificationRepository.countByRecipientIdAndReadAtIsNullAndIsDeletedFalse(employeeId))
                .feedbackCount(0) // Placeholder for feedback logic
                .performanceTrend(trend)
                .kpiStatus(List.of(
                    EmployeeDashboardResponse.KpiProgress.builder().name("Completed").value((int) kpiGoals.stream().flatMap(g -> g.getItems().stream()).filter(i -> i.getStatus() == KpiItemStatus.COMPLETED).count()).build(),
                    EmployeeDashboardResponse.KpiProgress.builder().name("Ongoing").value((int) kpiGoals.stream().flatMap(g -> g.getItems().stream()).filter(i -> i.getStatus() != KpiItemStatus.COMPLETED).count()).build()
                ))
                .appraisalTimeline(List.of(
                    EmployeeDashboardResponse.UpcomingPhase.builder().phase("Self Assessment").status("In Progress").date("May 20").active(true).build()
                ))
                .tasks(notificationRepository.findByRecipientIdAndReadAtIsNullAndIsDeletedFalse(employeeId).stream()
                        .limit(5)
                        .map(n -> EmployeeDashboardResponse.DashboardTask.builder()
                                .id(n.getId())
                                .title(n.getMessage())
                                .deadline("ASAP")
                                .priority("Medium")
                                .build())
                        .collect(Collectors.toList()))
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

        return ManagerDashboardResponse.builder()
                .teamSize(subordinates.size())
                .reviewsCompleted((int) completed)
                .totalReviews(subordinates.size())
                .pendingReviews((int) (subordinates.size() - completed))
                .feedbackRequests(0)
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
                                    .color("bg-blue-500")
                                    .build();
                        })
                        .collect(Collectors.toList()))
                .urgentReviews(new ArrayList<>())
                .build();
    }
}
