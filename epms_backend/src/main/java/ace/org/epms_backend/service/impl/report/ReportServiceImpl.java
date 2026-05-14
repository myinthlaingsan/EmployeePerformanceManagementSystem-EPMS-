package ace.org.epms_backend.service.impl.report;

import ace.org.epms_backend.dto.report.*;
import ace.org.epms_backend.model.AuditLog;
import ace.org.epms_backend.model.appraisal.Appraisal;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.EmployeeDepartment;
import ace.org.epms_backend.model.employee.EmployeeTeam;
import ace.org.epms_backend.model.employee.ReportingLine;
import ace.org.epms_backend.model.feedback360.FeedbackRequest;
import ace.org.epms_backend.model.feedback360.FeedbackSummary;
import ace.org.epms_backend.model.appraisal.AppraisalSummary;
import ace.org.epms_backend.model.appraisal.SelfAssessment;
import ace.org.epms_backend.model.appraisal.ManagerEvaluation;
import ace.org.epms_backend.model.kpi.*;
import ace.org.epms_backend.model.pip.PipRecord;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.repository.employee.EmployeeTeamRepository;
import ace.org.epms_backend.repository.employee.ReportingLineRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackRequestRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackSummaryRepository;
import ace.org.epms_backend.service.report.ReportService;
import ace.org.epms_backend.util.JasperReportUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.core.type.TypeReference;
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
    private final PipProgressLogRepository pipProgressLogRepository;
    private final AuditLogRepository auditLogRepository;
    private final EmployeeRepository employeeRepository;
    private final KpiFinalScoreRepository kpiFinalScoreRepository;
    private final AppraisalCycleRepository appraisalCycleRepository;
    private final SelfAssessmentRepository selfAssessmentRepository;
    private final ManagerEvaluationRepository managerEvaluationRepository;
    private final FeedbackSummaryRepository feedbackSummaryRepository;
    private final AppraisalSummaryRepository appraisalSummaryRepository;
    private final ReportingLineRepository reportingLineRepository;
    private final EmployeeTeamRepository employeeTeamRepository;
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
                    .findByEmployee_IdAndGoalSet_Cycle_CycleId(employeeId, a.getCycle().getCycleId())
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

        List<PipDetailDTO> details = pips.stream().map(p -> {
            String objectives = p.getObjectives().stream()
                    .map(obj -> obj.getTitle() + " (" + obj.getStatus().name() + ")")
                    .collect(Collectors.joining("\n"));

            String progress = p.getObjectives().stream()
                    .flatMap(obj -> pipProgressLogRepository.findByObjective_ObjectiveId(obj.getObjectiveId()).stream())
                    .map(log -> log.getObjective().getTitle() + ": " + log.getProgressPercent() + "% - "
                            + log.getProgressNote())
                    .collect(Collectors.joining("\n"));

            return PipDetailDTO.builder()
                    .employeeName(p.getEmployee().getStaffName())
                    .startDate(p.getStartDate().toString())
                    .endDate(p.getEndDate().toString())
                    .status(p.getStatus().name())
                    .objectives(objectives)
                    .progressSummary(progress)
                    .outcome(p.getFinalOutcome() != null ? p.getFinalOutcome().name() : "PENDING")
                    .build();
        }).collect(Collectors.toList());

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

        ObjectMapper mapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);
        List<String> sensitiveKeys = List.of("password", "salary", "phoneNo", "contactAddress", "permanentAddress");

        return logs.stream().map(l -> {
            String sanitizedOld = sanitizeJson(l.getOldValues(), mapper, sensitiveKeys);
            String sanitizedNew = sanitizeJson(l.getNewValues(), mapper, sensitiveKeys);

            return AuditTrailReportDTO.builder()
                    .tableName(l.getTableName())
                    .action(l.getAction().name())
                    .changedBy(l.getChangedBy() != null ? l.getChangedBy().getStaffName() : "SYSTEM")
                    .changedAt(l.getChangedAt().toString())
                    .oldValues(sanitizedOld)
                    .newValues(sanitizedNew)
                    .build();
        }).collect(Collectors.toList());
    }

    private String sanitizeJson(String json, ObjectMapper mapper, List<String> sensitiveKeys) {
        if (json == null || json.isEmpty())
            return "{}";
        try {
            Map<String, Object> map = mapper.readValue(json, new TypeReference<Map<String, Object>>() {
            });
            for (String key : sensitiveKeys) {
                if (map.containsKey(key)) {
                    map.put(key, "********"); // Mask the value
                }
            }
            return mapper.writeValueAsString(map);
        } catch (Exception e) {
            return json; // Fallback if not valid JSON
        }
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

        List<DeptPerformanceReportDTO> results = byDept.entrySet().stream().map(entry -> {
            String deptName = entry.getKey();
            List<Appraisal> deptAppraisals = entry.getValue();

            double avgKpi = deptAppraisals.stream()
                    .mapToDouble(
                            a -> kpiFinalScoreRepository.findByEmployee_IdAndGoalSet_Cycle_CycleId(a.getEmployee().getId(), cycleId)
                                    .map(s -> s.getWeightedScore().doubleValue()).orElse(0.0))
                    .average().orElse(0.0);

            double avgAppraisal = deptAppraisals.stream()
                    .mapToDouble(a -> appraisalSummaryRepository
                            .findByEmployee_IdAndCycle_CycleId(a.getEmployee().getId(), cycleId)
                            .map(s -> s.getTotalScore().doubleValue()).orElse(0.0))
                    .average().orElse(0.0);

            long topPerformers = deptAppraisals.stream()
                    .filter(a -> a.getPerformanceCategory() != null &&
                            (a.getPerformanceCategory().getName().contains("Exceed") ||
                                    a.getPerformanceCategory().getName().contains("Top") ||
                                    (a.getPerformanceCategory().getRatingValue() != null
                                            && a.getPerformanceCategory().getRatingValue() >= 4)))
                    .count();

            long lowPerformers = deptAppraisals.stream()
                    .filter(a -> a.getPerformanceCategory() != null &&
                            (a.getPerformanceCategory().getName().contains("Need") ||
                                    a.getPerformanceCategory().getName().contains("Below") ||
                                    (a.getPerformanceCategory().getRatingValue() != null
                                            && a.getPerformanceCategory().getRatingValue() <= 2)))
                    .count();

            return DeptPerformanceReportDTO.builder()
                    .departmentName(deptName)
                    .averageKpiScore(BigDecimal.valueOf(avgKpi).setScale(2, BigDecimal.ROUND_HALF_UP))
                    .averageAppraisalScore(BigDecimal.valueOf(avgAppraisal).setScale(2, BigDecimal.ROUND_HALF_UP))
                    .employeeCount(deptAppraisals.size())
                    .topPerformersCount((int) topPerformers)
                    .lowPerformersCount((int) lowPerformers)
                    .build();
        }).collect(Collectors.toList());

        // Calculate Rank based on averageAppraisalScore
        results.sort((d1, d2) -> d2.getAverageAppraisalScore().compareTo(d1.getAverageAppraisalScore()));
        for (int i = 0; i < results.size(); i++) {
            results.get(i).setRank(i + 1);
        }

        return results;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PromotionReadinessReportDTO> getPromotionReadinessReport() {
        List<Employee> employees = employeeRepository.findAll();
        List<AppraisalCycle> recentCycles = appraisalCycleRepository.findAllByOrderByEndDateDesc();

        return employees.stream().map(e -> {
            List<Appraisal> eAppraisals = appraisalRepository.findByEmployee_Id(e.getId()).stream()
                    .sorted((a1, a2) -> {
                        if (a2.getFinalizedAt() == null && a1.getFinalizedAt() == null)
                            return 0;
                        if (a2.getFinalizedAt() == null)
                            return -1;
                        if (a1.getFinalizedAt() == null)
                            return 1;
                        return a2.getFinalizedAt().compareTo(a1.getFinalizedAt());
                    })
                    .collect(Collectors.toList());

            Appraisal lastAppraisal = eAppraisals.isEmpty() ? null : eAppraisals.get(0);

            // Collect historical scores (last 3 cycles)
            String history = eAppraisals.stream()
                    .limit(3)
                    .map(a -> {
                        BigDecimal score = appraisalSummaryRepository
                                .findByEmployee_IdAndCycle_CycleId(e.getId(), a.getCycle().getCycleId())
                                .map(AppraisalSummary::getTotalScore).orElse(BigDecimal.ZERO);
                        return a.getCycle().getCycleName() + ": " + score;
                    })
                    .collect(Collectors.joining(", "));

            String rating = lastAppraisal != null && lastAppraisal.getPerformanceCategory() != null
                    ? lastAppraisal.getPerformanceCategory().getName()
                    : "N/A";

            boolean isReady = rating.contains("Exceed") || rating.contains("Top");

            String justification = isReady
                    ? "Consistently high performance ratings in recent cycles. Demonstrates leadership potential and role mastery."
                    : "Performance meets basic requirements but requires more consistency in high-impact areas before promotion.";

            EmployeeDepartment ed = employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(e.getId())
                    .orElse(null);

            return PromotionReadinessReportDTO.builder()
                    .employeeName(e.getStaffName())
                    .departmentName(ed != null ? ed.getCurrentDepartment().getDepartmentName() : "N/A")
                    .currentPosition(e.getPosition() != null ? e.getPosition().getPositionName() : "N/A")
                    .currentLevel(e.getLevel() != null ? e.getLevel().getLevelName() : "N/A")
                    .yearsInPosition(2) // Mocked value
                    .historicalScores(history)
                    .lastAppraisalRating(rating)
                    .isReady(isReady)
                    .recommendation(isReady ? "Promote to Next Level" : "Continue in Current Role")
                    .justification(justification)
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

    @Override
    @Transactional(readOnly = true)
    public EmployeePerformanceSummaryDTO getEmployeePerformanceSummary(Long employeeId, Long cycleId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        Appraisal appraisal = appraisalRepository.findByEmployee_IdAndCycle_CycleId(employeeId, cycleId)
                .orElseThrow(() -> new RuntimeException("Appraisal not found for this cycle"));

        EmployeeDepartment ed = employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(employeeId).orElse(null);

        BigDecimal kpiScore = kpiFinalScoreRepository.findByEmployee_IdAndGoalSet_Cycle_CycleId(employeeId, cycleId)
                .map(KpiFinalScore::getWeightedScore).orElse(BigDecimal.ZERO);

        BigDecimal selfScore = selfAssessmentRepository.findByAppraisal_AppraisalId(appraisal.getAppraisalId())
                .map(SelfAssessment::getTotalScore).orElse(BigDecimal.ZERO);

        BigDecimal managerScore = managerEvaluationRepository.findByAppraisal_AppraisalId(appraisal.getAppraisalId())
                .map(ManagerEvaluation::getTotalScore).orElse(BigDecimal.ZERO);

        String managerComment = managerEvaluationRepository.findByAppraisal_AppraisalId(appraisal.getAppraisalId())
                .map(ManagerEvaluation::getFinalComment).orElse("");

        BigDecimal feedbackScore = feedbackSummaryRepository.findByEmployeeIdAndCycleCycleId(employeeId, cycleId)
                .map(FeedbackSummary::getFinalScore).orElse(BigDecimal.ZERO);

        BigDecimal finalScore = appraisalSummaryRepository.findByEmployee_IdAndCycle_CycleId(employeeId, cycleId)
                .map(AppraisalSummary::getTotalScore).orElse(BigDecimal.ZERO);

        String finalRating = appraisal.getPerformanceCategory() != null ? appraisal.getPerformanceCategory().getName()
                : "N/A";

        return EmployeePerformanceSummaryDTO.builder()
                .employeeCode(employee.getEmployeeCode())
                .employeeName(employee.getStaffName())
                .departmentName(ed != null ? ed.getCurrentDepartment().getDepartmentName() : "N/A")
                .positionName(employee.getPosition() != null ? employee.getPosition().getPositionName() : "N/A")
                .cycleName(appraisal.getCycle().getCycleName())
                .kpiScore(kpiScore)
                .selfScore(selfScore)
                .managerScore(managerScore)
                .feedbackScore(feedbackScore)
                .finalScore(finalScore)
                .finalRating(finalRating)
                .managerComments(managerComment)
                .hrComments(appraisal.getApprovalComment())
                .selfComments("")
                .build();
    }

    @Override
    public byte[] exportEmployeePerformanceSummary(Long employeeId, Long cycleId, String format) {
        EmployeePerformanceSummaryDTO data = getEmployeePerformanceSummary(employeeId, cycleId);
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("reportTitle", "Employee Performance Summary");
        String jrxmlPath = "reports/performance_summary_report.jrxml";
        return generateReport(jrxmlPath, parameters, List.of(data), format);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PerformanceRankingReportDTO> getPerformanceRankingReport(Long cycleId) {
        AppraisalCycle currentCycle = appraisalCycleRepository.findById(cycleId)
                .orElseThrow(() -> new RuntimeException("Cycle not found"));

        // Find previous cycle
        List<AppraisalCycle> allCycles = appraisalCycleRepository.findAllByOrderByEndDateDesc();
        AppraisalCycle previousCycle = null;
        for (int i = 0; i < allCycles.size(); i++) {
            if (allCycles.get(i).getCycleId().equals(cycleId) && i + 1 < allCycles.size()) {
                previousCycle = allCycles.get(i + 1);
                break;
            }
        }

        final AppraisalCycle prevCycle = previousCycle;
        List<Appraisal> appraisals = appraisalRepository.findByCycle_CycleId(cycleId);

        List<PerformanceRankingReportDTO> results = appraisals.stream().filter(a -> a.getPerformanceCategory() != null).map(a -> {
            String name = a.getPerformanceCategory().getName();
            Integer rating = a.getPerformanceCategory().getRatingValue();
            boolean isHigh = name.contains("Exceed") || name.contains("Top") || (rating != null && rating >= 4);
            boolean isLow = name.contains("Need") || name.contains("Below") || (rating != null && rating <= 2);

            if (!isHigh && !isLow)
                return null;

            BigDecimal currentScore = appraisalSummaryRepository
                    .findByEmployee_IdAndCycle_CycleId(a.getEmployee().getId(), cycleId)
                    .map(AppraisalSummary::getTotalScore).orElse(BigDecimal.ZERO);

            BigDecimal prevScore = BigDecimal.ZERO;
            if (prevCycle != null) {
                prevScore = appraisalSummaryRepository
                        .findByEmployee_IdAndCycle_CycleId(a.getEmployee().getId(), prevCycle.getCycleId())
                        .map(AppraisalSummary::getTotalScore).orElse(BigDecimal.ZERO);
            }

            String trend = "STABLE";
            if (prevScore.compareTo(BigDecimal.ZERO) > 0) {
                int comparison = currentScore.compareTo(prevScore);
                if (comparison > 0)
                    trend = "UP";
                else if (comparison < 0)
                    trend = "DOWN";
            }

            EmployeeDepartment ed = employeeDepartmentRepository
                    .findByEmployeeIdAndIsCurrentTrue(a.getEmployee().getId()).orElse(null);

            return PerformanceRankingReportDTO.builder()
                    .employeeName(a.getEmployee().getStaffName())
                    .departmentName(ed != null ? ed.getCurrentDepartment().getDepartmentName() : "N/A")
                    .finalScore(currentScore)
                    .previousScore(prevScore)
                    .rating(name)
                    .trend(trend)
                    .isHighPerformer(isHigh)
                    .build();
        })
                .filter(dto -> dto != null)
                .sorted((d1, d2) -> {
                    if (Boolean.TRUE.equals(d1.getIsHighPerformer()) && !Boolean.TRUE.equals(d2.getIsHighPerformer()))
                        return -1;
                    if (!Boolean.TRUE.equals(d1.getIsHighPerformer()) && Boolean.TRUE.equals(d2.getIsHighPerformer()))
                        return 1;
                    return d2.getFinalScore().compareTo(d1.getFinalScore());
                })
                .collect(Collectors.toList());

        // Assign Rank
        for (int i = 0; i < results.size(); i++) {
            results.get(i).setRank(i + 1);
        }

        return results;
    }

    @Override
    public byte[] exportPerformanceRankingReport(Long cycleId, String format) {
        List<PerformanceRankingReportDTO> data = getPerformanceRankingReport(cycleId);
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("reportTitle", "High and Low Performers Report");
        String jrxmlPath = "reports/performance_ranking_report.jrxml";
        return generateReport(jrxmlPath, parameters, data, format);
    }

    @Override
    public byte[] exportEmployeeMasterReport(Long departmentId, Long teamId, String format) {
        List<Employee> employees;

        if (teamId != null) {
            // Filter by formal Team (from employee_team table)
            employees = employeeTeamRepository.findByTeamTeamId(teamId)
                    .stream().map(EmployeeTeam::getEmployee).collect(Collectors.toList());
        } else if (departmentId != null) {
            // Filter by Department
            employees = employeeDepartmentRepository.findByCurrentDepartmentIdAndIsCurrentTrue(departmentId)
                    .stream().map(EmployeeDepartment::getEmployee).collect(Collectors.toList());
        } else {
            // All Employees
            employees = employeeRepository.findAll();
        }

        List<EmployeeReportDTO> data = employees.stream().map(e -> {
            EmployeeDepartment ed = employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(e.getId()).orElse(null);
            ReportingLine rl = reportingLineRepository.findFirstByEmployee_IdAndIsActiveTrue(e.getId()).orElse(null);
            EmployeeTeam et = employeeTeamRepository.findFirstByEmployeeIdAndIsPrimaryTrue(e.getId()).orElse(null);

            return EmployeeReportDTO.builder()
                    .employeeCode(e.getEmployeeCode())
                    .staffName(e.getStaffName())
                    .email(e.getEmail())
                    .departmentName(ed != null ? ed.getCurrentDepartment().getDepartmentName() : "N/A")
                    .positionName(e.getPosition() != null ? e.getPosition().getPositionName() : "N/A")
                    .levelName(e.getLevel() != null ? e.getLevel().getLevelName() : "N/A")
                    .teamName(et != null ? et.getTeam().getTeamName() : "N/A")
                    .directManagerName(rl != null ? rl.getManager().getStaffName() : "N/A")
                    .status(e.getIsActive() ? "Active" : "Inactive")
                    .joinedDate(e.getDateOfAppointment() != null ? e.getDateOfAppointment().toString() : "N/A")
                    .build();
        }).collect(Collectors.toList());

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("reportTitle", "Employee Master List");
        String jrxmlPath = "reports/employee_master_report.jrxml";
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
