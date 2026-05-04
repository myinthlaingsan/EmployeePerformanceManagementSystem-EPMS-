package ace.org.epms_backend.service.impl.report;

import ace.org.epms_backend.dto.report.*;
import ace.org.epms_backend.model.AuditLog;
import ace.org.epms_backend.model.appraisal.Appraisal;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.EmployeeDepartment;
import ace.org.epms_backend.model.feedback360.FeedbackRequest;
import ace.org.epms_backend.model.kpi.*;
import ace.org.epms_backend.model.pip.PipRecord;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.repository.feedback360.FeedbackRequestRepository;
import ace.org.epms_backend.service.report.ReportService;
import ace.org.epms_backend.util.JasperReportUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final KpiGoalsRepository kpiGoalsRepository;
    private final AppraisalRepository appraisalRepository;
    private final EmployeeDepartmentRepository employeeDepartmentRepository;
    private final FeedbackRequestRepository feedbackRequestRepository;
    private final PipRecordRepository pipRecordRepository;
    private final AuditLogRepository auditLogRepository;
    private final EmployeeRepository employeeRepository;
    private final KpiFinalScoreRepository kpiFinalScoreRepository;
    private final AppraisalCycleRepository appraisalCycleRepository;
    private final JasperReportUtil jasperReportUtil;

    @Override
    @Transactional(readOnly = true)
    public List<KpiAchievementReportDTO> getKpiAchievementReport(Long cycleId, Long departmentId) {
        List<KpiGoals> goalsList = kpiGoalsRepository.findByCycleAndDepartment(cycleId, departmentId);

        return goalsList.stream().map(goal -> {
            EmployeeDepartment ed = employeeDepartmentRepository
                    .findByEmployeeIdAndIsCurrentTrue(goal.getEmployee().getId())
                    .orElse(null);

            List<KpiItemDetailDTO> items = goal.getItems().stream().map(item -> KpiItemDetailDTO.builder()
                    .categoryName(item.getCategory() != null ? item.getCategory().getName() : "N/A")
                    .title(item.getTitle())
                    .unit(item.getUnit())
                    .targetValue(item.getTargetValue())
                    .actualValue(item.getActualValue())
                    .weightPercent(item.getWeightPercent())
                    .scorePercent(item.getScorePercent())
                    .weightedScore(item.getWeightedScore())
                    .status(item.getStatus() != null ? item.getStatus().name() : "N/A")
                    .build()).collect(Collectors.toList());

            BigDecimal totalWeightedScore = items.stream()
                    .map(KpiItemDetailDTO::getWeightedScore)
                    .filter(score -> score != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            return KpiAchievementReportDTO.builder()
                    .employeeId(goal.getEmployee().getId())
                    .employeeName(goal.getEmployee().getStaffName())
                    .departmentName(ed != null ? ed.getCurrentDepartment().getDepartmentName() : "N/A")
                    .cycleName(goal.getCycle() != null ? goal.getCycle().getCycleName() : "N/A")
                    .totalWeightedScore(totalWeightedScore)
                    .kpiItems(items)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AppraisalStatusReportDTO getAppraisalStatusReport(Long cycleId) {
        List<Appraisal> appraisals = appraisalRepository.findByCycle_CycleId(cycleId);
        String cycleName = appraisalCycleRepository.findById(cycleId).map(c -> c.getCycleName()).orElse("N/A");

        int completed = (int) appraisals.stream().filter(a -> "COMPLETED".equals(a.getStatus().name())).count();
        int inProgress = (int) appraisals.stream()
                .filter(a -> !"COMPLETED".equals(a.getStatus().name()) && !"PENDING".equals(a.getStatus().name()))
                .count();
        int pending = (int) appraisals.stream().filter(a -> "PENDING".equals(a.getStatus().name())).count();

        List<EmployeeStatusDTO> details = appraisals.stream().map(a -> {
            EmployeeDepartment ed = employeeDepartmentRepository
                    .findByEmployeeIdAndIsCurrentTrue(a.getEmployee().getId()).orElse(null);
            return EmployeeStatusDTO.builder()
                    .employeeName(a.getEmployee().getStaffName())
                    .departmentName(ed != null ? ed.getCurrentDepartment().getDepartmentName() : "N/A")
                    .status(a.getStatus().name())
                    .selfAssessmentDate(a.getSelfSubmittedAt() != null ? a.getSelfSubmittedAt().toString() : null)
                    .managerEvaluationDate(
                            a.getManagerSubmittedAt() != null ? a.getManagerSubmittedAt().toString() : null)
                    .build();
        }).collect(Collectors.toList());

        return AppraisalStatusReportDTO.builder()
                .cycleName(cycleName)
                .totalEmployees(appraisals.size())
                .completed(completed)
                .inProgress(inProgress)
                .pending(pending)
                .employeeStatuses(details)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PerformanceTrendReportDTO getPerformanceTrendReport(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId).orElseThrow();
        List<Appraisal> appraisals = appraisalRepository.findByEmployee_Id(employeeId);

        List<CycleScoreDTO> trends = appraisals.stream().map(a -> {
            BigDecimal kpiScore = kpiFinalScoreRepository
                    .findByEmployeeIdAndCycleId(employeeId, a.getCycle().getCycleId())
                    .map(KpiFinalScore::getWeightedScore).orElse(BigDecimal.ZERO);

            return CycleScoreDTO.builder()
                    .cycleName(a.getCycle().getCycleName())
                    .kpiScore(kpiScore)
                    .performanceCategory(
                            a.getPerformanceCategory() != null ? a.getPerformanceCategory().getName() : "N/A")
                    .build();
        }).collect(Collectors.toList());

        return PerformanceTrendReportDTO.builder()
                .employeeName(employee.getStaffName())
                .trends(trends)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public FeedbackParticipationReportDTO getFeedbackParticipationReport(Long cycleId) {
        List<FeedbackRequest> requests = feedbackRequestRepository.findByCycleCycleId(cycleId);
        String cycleName = appraisalCycleRepository.findById(cycleId).map(AppraisalCycle::getCycleName).orElse("N/A");

        Map<Long, List<FeedbackRequest>> requestsByTarget = requests.stream()
                .collect(Collectors.groupingBy(r -> r.getTargetUser().getId()));

        List<EmployeeFeedbackDTO> participation = requestsByTarget.entrySet().stream().map(entry -> {
            List<FeedbackRequest> employeeRequests = entry.getValue();
            Employee target = employeeRequests.get(0).getTargetUser();
            int requested = employeeRequests.size();
            int completed = (int) employeeRequests.stream().filter(r -> "COMPLETED".equals(r.getStatus().name()))
                    .count();

            return EmployeeFeedbackDTO.builder()
                    .employeeName(target.getStaffName())
                    .requestedCount(requested)
                    .completedCount(completed)
                    .participationRate(requested > 0 ? (double) completed / requested * 100 : 0)
                    .build();
        }).collect(Collectors.toList());

        return FeedbackParticipationReportDTO.builder()
                .cycleName(cycleName)
                .participation(participation)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PipTrackingReportDTO getPipTrackingReport() {
        List<PipRecord> pips = pipRecordRepository.findAll();
        int active = (int) pips.stream().filter(p -> "ACTIVE".equals(p.getStatus().name())).count();
        int completed = (int) pips.size() - active;

        List<PipDetailDTO> details = pips.stream().map(p -> PipDetailDTO.builder()
                .employeeName(p.getEmployee().getStaffName())
                .startDate(p.getStartDate().toString())
                .endDate(p.getEndDate().toString())
                .status(p.getStatus().name())
                .outcome(p.getFinalOutcome() != null ? p.getFinalOutcome().name() : "PENDING")
                .build()).collect(Collectors.toList());

        return PipTrackingReportDTO.builder()
                .totalActivePip(active)
                .completedPip(completed)
                .pipDetails(details)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditTrailReportDTO> getAuditTrailReport(String tableName, Long recordId) {
        List<AuditLog> logs;
        if (tableName != null && recordId != null) {
            logs = auditLogRepository.findByTableNameAndRecordId(tableName, recordId);
        } else if (tableName != null) {
            logs = auditLogRepository.findByTableName(tableName);
        } else {
            logs = auditLogRepository.findAll();
        }

        return logs.stream().map(l -> AuditTrailReportDTO.builder()
                .tableName(l.getTableName())
                .action(l.getAction().name())
                .changedBy(l.getChangedBy() != null ? l.getChangedBy().getStaffName() : "SYSTEM")
                .changedAt(l.getChangedAt().toString())
                .oldValues(l.getOldValues())
                .newValues(l.getNewValues())
                .build()).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeptPerformanceReportDTO> getDeptPerformanceComparison(Long cycleId) {
        List<Appraisal> appraisals = appraisalRepository.findByCycle_CycleId(cycleId);

        Map<String, List<Appraisal>> byDept = appraisals.stream()
                .collect(Collectors.groupingBy(a -> {
                    EmployeeDepartment ed = employeeDepartmentRepository
                            .findByEmployeeIdAndIsCurrentTrue(a.getEmployee().getId()).orElse(null);
                    return ed != null ? ed.getCurrentDepartment().getDepartmentName() : "Unknown";
                }));

        return byDept.entrySet().stream().map(entry -> {
            String deptName = entry.getKey();
            List<Appraisal> deptAppraisals = entry.getValue();

            double avgKpi = deptAppraisals.stream()
                    .mapToDouble(
                            a -> kpiFinalScoreRepository.findByEmployeeIdAndCycleId(a.getEmployee().getId(), cycleId)
                                    .map(s -> s.getWeightedScore().doubleValue()).orElse(0.0))
                    .average().orElse(0.0);

            long topPerformers = deptAppraisals.stream()
                    .filter(a -> a.getPerformanceCategory() != null &&
                            (a.getPerformanceCategory().getName().contains("Exceed") ||
                                    a.getPerformanceCategory().getName().contains("Top")))
                    .count();

            return DeptPerformanceReportDTO.builder()
                    .departmentName(deptName)
                    .averageKpiScore(BigDecimal.valueOf(avgKpi))
                    .employeeCount(deptAppraisals.size())
                    .topPerformersCount((int) topPerformers)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PromotionReadinessReportDTO> getPromotionReadinessReport() {
        List<Employee> employees = employeeRepository.findAll();

        return employees.stream().map(e -> {
            Appraisal lastAppraisal = appraisalRepository.findByEmployee_Id(e.getId()).stream()
                    .sorted((a1, a2) -> {
                        if (a2.getFinalizedAt() == null && a1.getFinalizedAt() == null)
                            return 0;
                        if (a2.getFinalizedAt() == null)
                            return -1;
                        if (a1.getFinalizedAt() == null)
                            return 1;
                        return a2.getFinalizedAt().compareTo(a1.getFinalizedAt());
                    })
                    .findFirst().orElse(null);

            String rating = lastAppraisal != null && lastAppraisal.getPerformanceCategory() != null
                    ? lastAppraisal.getPerformanceCategory().getName()
                    : "N/A";

            boolean isReady = rating.contains("Exceed") || rating.contains("Top");

            return PromotionReadinessReportDTO.builder()
                    .employeeName(e.getStaffName())
                    .currentPosition(e.getPosition() != null ? e.getPosition().getPositionName() : "N/A")
                    .currentLevel(e.getLevel() != null ? e.getLevel().getLevelName() : "N/A")
                    .yearsInPosition(2) // Mocked value, would need joinedAt or similar
                    .lastAppraisalRating(rating)
                    .isReady(isReady)
                    .recommendation(isReady ? "Ready for Promotion" : "Needs more development")
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportKpiAchievementReport(Long cycleId, Long departmentId, String format) {
        List<KpiAchievementReportDTO> data = getKpiAchievementReport(cycleId, departmentId);
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("reportTitle", "KPI Achievement Report");
        String jrxmlPath = "reports/kpi_achievement_report.jrxml";
        return generateReport(jrxmlPath, parameters, data, format);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportAppraisalStatusReport(Long cycleId, String format) {
        AppraisalStatusReportDTO data = getAppraisalStatusReport(cycleId);
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("reportTitle", "Appraisal Completion Status");
        String jrxmlPath = "reports/appraisal_status_report.jrxml";
        return generateReport(jrxmlPath, parameters, List.of(data), format);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportPerformanceTrendReport(Long employeeId, String format) {
        PerformanceTrendReportDTO data = getPerformanceTrendReport(employeeId);
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("reportTitle", "Historical Performance Trend");
        String jrxmlPath = "reports/performance_trend_report.jrxml";
        return generateReport(jrxmlPath, parameters, List.of(data), format);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportFeedbackParticipationReport(Long cycleId, String format) {
        FeedbackParticipationReportDTO data = getFeedbackParticipationReport(cycleId);
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("reportTitle", "360 Feedback Participation");
        String jrxmlPath = "reports/feedback_participation_report.jrxml";
        return generateReport(jrxmlPath, parameters, List.of(data), format);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportPipTrackingReport(String format) {
        PipTrackingReportDTO data = getPipTrackingReport();
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("reportTitle", "PIP Tracking Report");
        String jrxmlPath = "reports/pip_tracking_report.jrxml";
        return generateReport(jrxmlPath, parameters, List.of(data), format);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportAuditTrailReport(String tableName, Long recordId, String format) {
        List<AuditTrailReportDTO> data = getAuditTrailReport(tableName, recordId);
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("reportTitle", "Audit Trail Report");
        String jrxmlPath = "reports/audit_trail_report.jrxml";
        return generateReport(jrxmlPath, parameters, data, format);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportDeptPerformanceComparison(Long cycleId, String format) {
        List<DeptPerformanceReportDTO> data = getDeptPerformanceComparison(cycleId);
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("reportTitle", "Department Performance Comparison");
        String jrxmlPath = "reports/dept_performance_report.jrxml";
        return generateReport(jrxmlPath, parameters, data, format);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportPromotionReadinessReport(String format) {
        List<PromotionReadinessReportDTO> data = getPromotionReadinessReport();
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("reportTitle", "Promotion Readiness Report");
        String jrxmlPath = "reports/promotion_readiness_report.jrxml";
        return generateReport(jrxmlPath, parameters, data, format);
    }

    private byte[] generateReport(String jrxmlPath, Map<String, Object> parameters, List<?> data, String format) {
        if ("pdf".equalsIgnoreCase(format)) {
            return jasperReportUtil.generatePdfReport(jrxmlPath, parameters, data);
        } else {
            return jasperReportUtil.generateExcelReport(jrxmlPath, parameters, data);
        }
    }
}
