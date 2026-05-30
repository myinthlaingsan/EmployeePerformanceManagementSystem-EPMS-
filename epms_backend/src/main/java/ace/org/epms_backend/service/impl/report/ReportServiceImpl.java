package ace.org.epms_backend.service.impl.report;

import ace.org.epms_backend.dto.report.*;
import ace.org.epms_backend.dto.feedback360.CategoryScore;
import ace.org.epms_backend.dto.feedback360.DetailedComment;
import ace.org.epms_backend.dto.feedback360.FeedbackSummaryResponse;
import ace.org.epms_backend.enums.AppraisalStatus;
import ace.org.epms_backend.enums.FormType;
import ace.org.epms_backend.exception.InvalidAppraisalStateException;
import ace.org.epms_backend.model.appraisal.*;
import ace.org.epms_backend.service.feedback360.FeedbackReportService;
import ace.org.epms_backend.model.AuditLog;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.EmployeeDepartment;
import ace.org.epms_backend.model.employee.EmployeeTeam;
import ace.org.epms_backend.model.employee.ReportingLine;
import ace.org.epms_backend.model.feedback360.Feedback;
import ace.org.epms_backend.model.feedback360.FeedbackResponse;
import ace.org.epms_backend.model.feedback360.FeedbackRequest;
import ace.org.epms_backend.model.feedback360.FeedbackSummary;
import ace.org.epms_backend.model.kpi.*;
import ace.org.epms_backend.model.pip.PipRecord;
import ace.org.epms_backend.model.pip.PipObjective;
import ace.org.epms_backend.enums.PipStatus;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.repository.employee.EmployeeTeamRepository;
import ace.org.epms_backend.repository.employee.ReportingLineRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackRequestRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackSummaryRepository;
import ace.org.epms_backend.service.report.ReportService;
import ace.org.epms_backend.util.JasperReportUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import ace.org.epms_backend.exception.NotFoundException;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.core.type.TypeReference;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
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
    private final FeedbackReportService feedbackReportService;
    private final QuestionRepository questionRepository;
    private final FeedbackRepository feedbackRepository;
    private final SelfAssessmentAnswerRepository selfAssessmentAnswerRepository;
    private final ManagerEvaluationAnswerRepository managerEvaluationAnswerRepository;

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
            
            List<FeedbackRequest> requests = feedbackRequestRepository.findByTargetUserIdAndCycleCycleId(a.getEmployee().getId(), cycleId);
            String completionRateStr = "-";
            if (!requests.isEmpty()) {
                long completedRequests = requests.stream()
                        .filter(r -> "COMPLETED".equals(r.getStatus().name()))
                        .count();
                double rate = (completedRequests * 100.0) / requests.size();
                completionRateStr = String.format("%.2f%%", rate);
            }

            return EmployeeStatusDTO.builder()
                    .employeeName(a.getEmployee().getStaffName())
                    .departmentName(ed != null ? ed.getCurrentDepartment().getDepartmentName() : "N/A")
                    .status(a.getStatus().name())
                    .selfAssessmentDate(a.getSelfSubmittedAt() != null ? a.getSelfSubmittedAt().toString() : null)
                    .managerEvaluationDate(
                            a.getManagerSubmittedAt() != null ? a.getManagerSubmittedAt().toString() : null)
                    .feedbackCompletionRate(completionRateStr)
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

            BigDecimal appraisalScore = appraisalSummaryRepository
                    .findByEmployee_IdAndCycle_CycleId(employeeId, a.getCycle().getCycleId())
                    .map(AppraisalSummary::getTotalScore).orElse(BigDecimal.ZERO);

            return CycleScoreDTO.builder()
                    .cycleName(a.getCycle().getCycleName())
                    .kpiScore(kpiScore)
                    .appraisalScore(appraisalScore)
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
    public PerformanceDistributionReportDTO getPerformanceDistribution(Long cycleId, Long departmentId) {
        List<AppraisalSummary> summaries = appraisalSummaryRepository.findByCycle_CycleId(cycleId).stream()
                .filter(summary -> departmentId == null || employeeDepartmentRepository
                        .findByEmployeeIdAndIsCurrentTrue(summary.getEmployee().getId())
                        .map(ed -> ed.getCurrentDepartment() != null
                                && departmentId.equals(ed.getCurrentDepartment().getId()))
                        .orElse(false))
                .filter(summary -> summary.getTotalScore() != null)
                .collect(Collectors.toList());

        List<Double> scores = summaries.stream()
                .map(summary -> summary.getTotalScore().doubleValue())
                .sorted()
                .collect(Collectors.toList());

        int[] counts = new int[5];
        for (double score : scores) {
            if (score < 60) counts[0]++;
            else if (score < 70) counts[1]++;
            else if (score < 80) counts[2]++;
            else if (score < 90) counts[3]++;
            else counts[4]++;
        }

        String[] labels = {"<60", "60-69", "70-79", "80-89", "90+"};
        List<PerformanceDistributionBinDTO> bins = new ArrayList<>();
        for (int i = 0; i < labels.length; i++) {
            bins.add(PerformanceDistributionBinDTO.builder()
                    .range(labels[i])
                    .count(counts[i])
                    .percentage(scores.isEmpty() ? 0 : roundDouble((counts[i] * 100.0) / scores.size()))
                    .build());
        }

        double mean = scores.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        double median = 0;
        if (!scores.isEmpty()) {
            int middle = scores.size() / 2;
            median = scores.size() % 2 == 0 ? (scores.get(middle - 1) + scores.get(middle)) / 2 : scores.get(middle);
        }
        double variance = scores.stream().mapToDouble(score -> Math.pow(score - mean, 2)).average().orElse(0);
        double stdDev = Math.sqrt(variance);
        double skewness = stdDev == 0 ? 0 : scores.stream()
                .mapToDouble(score -> Math.pow((score - mean) / stdDev, 3))
                .average().orElse(0);

        return PerformanceDistributionReportDTO.builder()
                .bins(bins)
                .mean(toScaledBigDecimal(mean))
                .median(toScaledBigDecimal(median))
                .standardDeviation(toScaledBigDecimal(stdDev))
                .skewness(toScaledBigDecimal(skewness))
                .sampleSize(scores.size())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentAnalyticsDTO> getPerformanceByDepartment(Long cycleId) {
        List<Appraisal> appraisals = appraisalRepository.findByCycle_CycleId(cycleId);
        Map<Long, List<Appraisal>> byDept = appraisals.stream()
                .collect(Collectors.groupingBy(a -> employeeDepartmentRepository
                        .findByEmployeeIdAndIsCurrentTrue(a.getEmployee().getId())
                        .filter(ed -> ed.getCurrentDepartment() != null)
                        .map(ed -> ed.getCurrentDepartment().getId())
                        .orElse(0L)));

        List<DepartmentAnalyticsDTO> results = byDept.entrySet().stream().map(entry -> {
            List<Appraisal> deptAppraisals = entry.getValue();
            EmployeeDepartment firstDept = employeeDepartmentRepository
                    .findByEmployeeIdAndIsCurrentTrue(deptAppraisals.get(0).getEmployee().getId())
                    .orElse(null);
            String deptName = firstDept != null && firstDept.getCurrentDepartment() != null
                    ? firstDept.getCurrentDepartment().getDepartmentName()
                    : "Unassigned";
            double avgScore = deptAppraisals.stream()
                    .mapToDouble(a -> appraisalSummaryRepository
                            .findByEmployee_IdAndCycle_CycleId(a.getEmployee().getId(), cycleId)
                            .map(s -> s.getTotalScore() != null ? s.getTotalScore().doubleValue() : 0.0)
                            .orElse(0.0))
                    .filter(score -> score > 0)
                    .average().orElse(0);
            long completed = deptAppraisals.stream().filter(a -> "COMPLETED".equals(a.getStatus().name())
                    || "FINALIZED".equals(a.getStatus().name())
                    || "HR_APPROVED".equals(a.getStatus().name())).count();
            int pipCount = (int) pipRecordRepository.findAll().stream()
                    .filter(p -> "ACTIVE".equals(p.getStatus().name()))
                    .filter(p -> employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(p.getEmployee().getId())
                            .map(ed -> ed.getCurrentDepartment() != null
                                    && entry.getKey().equals(ed.getCurrentDepartment().getId()))
                            .orElse(false))
                    .count();

            return DepartmentAnalyticsDTO.builder()
                    .departmentId(entry.getKey().equals(0L) ? null : entry.getKey())
                    .departmentName(deptName)
                    .avgScore(toScaledBigDecimal(avgScore))
                    .completionRate(deptAppraisals.isEmpty() ? 0 : roundDouble((completed * 100.0) / deptAppraisals.size()))
                    .pipCount(pipCount)
                    .employeeCount(deptAppraisals.size())
                    .build();
        }).sorted((a, b) -> b.getAvgScore().compareTo(a.getAvgScore())).collect(Collectors.toList());

        for (int i = 0; i < results.size(); i++) {
            results.get(i).setRank(i + 1);
        }
        return results;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PerformanceTrendPointDTO> getOrganizationPerformanceTrend(int months) {
        List<AppraisalCycle> cycles = appraisalCycleRepository.findAllByOrderByEndDateDesc().stream()
                .limit(Math.max(1, months))
                .collect(Collectors.toList());
        Collections.reverse(cycles);

        return cycles.stream().map(cycle -> {
            Long cycleId = cycle.getCycleId();
            List<Appraisal> appraisals = appraisalRepository.findByCycle_CycleId(cycleId);
            double avgScore = appraisalSummaryRepository.findByCycle_CycleId(cycleId).stream()
                    .filter(s -> s.getTotalScore() != null)
                    .mapToDouble(s -> s.getTotalScore().doubleValue())
                    .average().orElse(0);
            long completed = appraisals.stream().filter(a -> "COMPLETED".equals(a.getStatus().name())
                    || "FINALIZED".equals(a.getStatus().name())
                    || "HR_APPROVED".equals(a.getStatus().name())).count();
            double engagement = feedbackSummaryRepository.findAll().stream()
                    .filter(summary -> summary.getCycle() != null && cycleId.equals(summary.getCycle().getCycleId()))
                    .filter(summary -> summary.getFinalScore() != null)
                    .mapToDouble(summary -> summary.getFinalScore().doubleValue())
                    .average().orElse(0);

            return PerformanceTrendPointDTO.builder()
                    .period(cycle.getCycleName())
                    .avgScore(toScaledBigDecimal(avgScore))
                    .completionRate(appraisals.isEmpty() ? 0 : roundDouble((completed * 100.0) / appraisals.size()))
                    .pipResolutionRate(calculatePipResolutionRate())
                    .engagementScore(toScaledBigDecimal(engagement))
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PerformancePotentialMatrixDTO> getPerformancePotentialMatrix(Long cycleId) {
        return appraisalRepository.findByCycle_CycleId(cycleId).stream().map(appraisal -> {
            BigDecimal performance = appraisalSummaryRepository
                    .findByEmployee_IdAndCycle_CycleId(appraisal.getEmployee().getId(), cycleId)
                    .map(AppraisalSummary::getTotalScore)
                    .orElse(BigDecimal.ZERO);
            BigDecimal potential = feedbackSummaryRepository
                    .findByEmployeeIdAndCycleCycleId(appraisal.getEmployee().getId(), cycleId)
                    .map(summary -> summary.getCalibratedFinalScore() != null ? summary.getCalibratedFinalScore()
                            : summary.getFinalScore() != null ? summary.getFinalScore()
                            : summary.getManagerScore() != null ? summary.getManagerScore()
                            : performance)
                    .orElse(performance);
            EmployeeDepartment ed = employeeDepartmentRepository
                    .findByEmployeeIdAndIsCurrentTrue(appraisal.getEmployee().getId()).orElse(null);

            return PerformancePotentialMatrixDTO.builder()
                    .employeeId(appraisal.getEmployee().getId())
                    .employeeName(appraisal.getEmployee().getStaffName())
                    .departmentName(ed != null && ed.getCurrentDepartment() != null
                            ? ed.getCurrentDepartment().getDepartmentName() : "N/A")
                    .performanceScore(performance)
                    .potentialScore(potential)
                    .quadrant(resolveQuadrant(performance.doubleValue(), potential.doubleValue()))
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public GoalCompletionReportDTO getGoalCompletion(Long cycleId) {
        List<KpiGoalItem> items = kpiGoalsRepository.findByCycleAndDepartment(cycleId, null).stream()
                .flatMap(goal -> goal.getItems().stream())
                .collect(Collectors.toList());
        int completed = (int) items.stream().filter(item -> item.getStatus() != null
                && "COMPLETED".equals(item.getStatus().name())).count();
        int inProgress = (int) items.stream().filter(item -> item.getStatus() != null
                && "IN_PROGRESS".equals(item.getStatus().name())).count();
        int notStarted = (int) items.stream().filter(item -> item.getStatus() == null
                || "NOT_STARTED".equals(item.getStatus().name())).count();
        int offTrack = (int) items.stream().filter(item -> item.getStatus() != null
                && !"COMPLETED".equals(item.getStatus().name())
                && item.getScorePercent() != null
                && item.getScorePercent().compareTo(BigDecimal.valueOf(50)) < 0).count();

        return GoalCompletionReportDTO.builder()
                .total(items.size())
                .completed(completed)
                .inProgress(inProgress)
                .notStarted(notStarted)
                .offTrack(offTrack)
                .completionRate(items.isEmpty() ? 0 : roundDouble((completed * 100.0) / items.size()))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Feedback360SummaryAnalyticsDTO getFeedback360SummaryAnalytics(Long cycleId) {
        List<FeedbackRequest> requests = feedbackRequestRepository.findByCycleCycleId(cycleId);
        int completed = (int) requests.stream().filter(request -> "COMPLETED".equals(request.getStatus().name())).count();
        double avgDays = requests.stream()
                .filter(request -> "COMPLETED".equals(request.getStatus().name()))
                .filter(request -> request.getCreatedAt() != null && request.getUpdatedAt() != null)
                .mapToLong(request -> java.time.Duration.between(request.getCreatedAt(), request.getUpdatedAt()).toDays())
                .average().orElse(0);

        Map<String, Long> relationshipCounts = requests.stream()
                .filter(request -> request.getRelationship() != null)
                .collect(Collectors.groupingBy(request -> request.getRelationship().name(), Collectors.counting()));
        List<String> commonThemes = relationshipCounts.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .map(entry -> formatTheme(entry.getKey()))
                .collect(Collectors.toList());

        double selfGap = feedbackSummaryRepository.findAll().stream()
                .filter(summary -> summary.getCycle() != null && cycleId.equals(summary.getCycle().getCycleId()))
                .filter(summary -> summary.getSelfScore() != null && summary.getFinalScore() != null)
                .mapToDouble(summary -> Math.abs(summary.getSelfScore().doubleValue() - summary.getFinalScore().doubleValue()))
                .average().orElse(0);

        return Feedback360SummaryAnalyticsDTO.builder()
                .totalRequests(requests.size())
                .completedResponses(completed)
                .participationRate(requests.isEmpty() ? 0 : roundDouble((completed * 100.0) / requests.size()))
                .avgResponseTimeDays(roundDouble(avgDays))
                .mostCommonFeedbackTheme(commonThemes.isEmpty() ? "No feedback yet" : commonThemes.get(0))
                .selfPerceptionGap(roundDouble(selfGap))
                .commonThemes(commonThemes)
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

    private BigDecimal toScaledBigDecimal(double value) {
        return BigDecimal.valueOf(value).setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private double roundDouble(double value) {
        return BigDecimal.valueOf(value).setScale(2, java.math.RoundingMode.HALF_UP).doubleValue();
    }

    private String resolveQuadrant(double performance, double potential) {
        boolean highPerformance = performance >= 75;
        boolean highPotential = potential >= 75;
        if (highPerformance && highPotential) return "Rising Stars";
        if (!highPerformance && highPotential) return "Emerging Leaders";
        if (highPerformance) return "Solid Contributors";
        return "Development Needed";
    }

    private double calculatePipResolutionRate() {
        List<PipRecord> pips = pipRecordRepository.findAll();
        if (pips.isEmpty()) return 0;
        long resolved = pips.stream()
                .filter(pip -> "COMPLETED".equals(pip.getStatus().name()) || "CLOSED".equals(pip.getStatus().name()))
                .count();
        return roundDouble((resolved * 100.0) / pips.size());
    }

    private String formatTheme(String value) {
        String lower = value.toLowerCase().replace("_", " ");
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
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
                            a -> kpiFinalScoreRepository
                                    .findByEmployee_IdAndGoalSet_Cycle_CycleId(a.getEmployee().getId(), cycleId)
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

            double avg360 = deptAppraisals.stream()
                    .mapToDouble(a -> {
                        Optional<FeedbackSummary> fsOpt = feedbackSummaryRepository
                                .findByEmployeeIdAndCycleCycleId(a.getEmployee().getId(), cycleId);
                        if (fsOpt.isPresent() && fsOpt.get().getFinalScore() != null) {
                            return fsOpt.get().getFinalScore().doubleValue();
                        }
                        return 0.0;
                    })
                    .filter(val -> val > 0.0)
                    .average().orElse(0.0);

            return DeptPerformanceReportDTO.builder()
                    .departmentName(deptName)
                    .averageKpiScore(BigDecimal.valueOf(avgKpi).setScale(2, BigDecimal.ROUND_HALF_UP))
                    .averageAppraisalScore(BigDecimal.valueOf(avgAppraisal).setScale(2, BigDecimal.ROUND_HALF_UP))
                    .average360Score(BigDecimal.valueOf(avg360).setScale(2, BigDecimal.ROUND_HALF_UP))
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
    public byte[] exportOrganizationPerformanceTrendReport(int months, String format) {
        List<PerformanceTrendPointDTO> data = getOrganizationPerformanceTrend(months);
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("reportTitle", "Organization Performance Trend");
        parameters.put("months", months);
        String jrxmlPath = "reports/org_performance_trend_report.jrxml";
        return generateReport(jrxmlPath, parameters, data, format);
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
                .employeeSignatureUrl(appraisal.getEmployeeSignComment() != null && appraisal.getEmployeeSignComment().startsWith("/uploads/") ? "http://localhost:8080" + appraisal.getEmployeeSignComment() : null)
                .managerSignatureUrl(appraisal.getManagerSignComment() != null && appraisal.getManagerSignComment().startsWith("/uploads/") ? "http://localhost:8080" + appraisal.getManagerSignComment() : null)
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

        List<PerformanceRankingReportDTO> results = appraisals.stream().filter(a -> a.getPerformanceCategory() != null)
                .map(a -> {
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
                            .currentScore(currentScore)
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
                    return d2.getCurrentScore().compareTo(d1.getCurrentScore());
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
            EmployeeDepartment ed = employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(e.getId())
                    .orElse(null);
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

    @Override
    @Transactional(readOnly = true)
    public Feedback360IndividualReportDTO getIndividual360Report(Long targetUserId, Long cycleId) {
        Employee employee = employeeRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        EmployeeDepartment ed = employeeDepartmentRepository
                .findByEmployeeIdAndIsCurrentTrue(targetUserId)
                .orElse(null);

        FeedbackSummaryResponse summaryResponse = feedbackReportService.getFeedbackSummary(targetUserId, cycleId);

        Map<String, FeedbackCategoryScoreDTO> catMap = new HashMap<>();
        
        if (summaryResponse.getSelfScores() != null) {
            for (CategoryScore cs : summaryResponse.getSelfScores()) {
                FeedbackCategoryScoreDTO dto = catMap.computeIfAbsent(cs.getCategoryName(), k -> new FeedbackCategoryScoreDTO());
                dto.setCategoryName(cs.getCategoryName());
                dto.setSelfScore(cs.getAverageScore());
            }
        }
        if (summaryResponse.getManagerScores() != null) {
            for (CategoryScore cs : summaryResponse.getManagerScores()) {
                FeedbackCategoryScoreDTO dto = catMap.computeIfAbsent(cs.getCategoryName(), k -> new FeedbackCategoryScoreDTO());
                dto.setCategoryName(cs.getCategoryName());
                dto.setManagerScore(cs.getAverageScore());
            }
        }
        if (summaryResponse.getPeerScores() != null) {
            for (CategoryScore cs : summaryResponse.getPeerScores()) {
                FeedbackCategoryScoreDTO dto = catMap.computeIfAbsent(cs.getCategoryName(), k -> new FeedbackCategoryScoreDTO());
                dto.setCategoryName(cs.getCategoryName());
                dto.setPeerScore(cs.getAverageScore());
            }
        }
        if (summaryResponse.getSubordinateScores() != null) {
            for (CategoryScore cs : summaryResponse.getSubordinateScores()) {
                FeedbackCategoryScoreDTO dto = catMap.computeIfAbsent(cs.getCategoryName(), k -> new FeedbackCategoryScoreDTO());
                dto.setCategoryName(cs.getCategoryName());
                dto.setSubordinateScore(cs.getAverageScore());
            }
        }
        if (summaryResponse.getScores() != null) {
            for (CategoryScore cs : summaryResponse.getScores()) {
                FeedbackCategoryScoreDTO dto = catMap.computeIfAbsent(cs.getCategoryName(), k -> new FeedbackCategoryScoreDTO());
                dto.setCategoryName(cs.getCategoryName());
                dto.setAverageScore(cs.getAverageScore());
            }
        }
        
        List<FeedbackCategoryScoreDTO> categoryScores = new ArrayList<>(catMap.values());

        List<FeedbackCommentDTO> comments = new ArrayList<>();
        if (summaryResponse.getDetailedComments() != null) {
            for (DetailedComment dc : summaryResponse.getDetailedComments()) {
                comments.add(FeedbackCommentDTO.builder()
                        .categoryName(dc.getCategoryName())
                        .relationship(dc.getEvaluatorRole())
                        .comment(dc.getComment())
                        .evaluatorName(dc.getEvaluatorName())
                        .score(dc.getScore())
                        .build());
            }
        }

        Double selfScore = summaryResponse.getSelfScores() != null && !summaryResponse.getSelfScores().isEmpty()
                ? summaryResponse.getSelfScores().stream().mapToDouble(CategoryScore::getAverageScore).average().orElse(0.0)
                : null;
        Double managerScore = summaryResponse.getManagerScores() != null && !summaryResponse.getManagerScores().isEmpty()
                ? summaryResponse.getManagerScores().stream().mapToDouble(CategoryScore::getAverageScore).average().orElse(0.0)
                : null;
        Double peerScore = summaryResponse.getPeerScores() != null && !summaryResponse.getPeerScores().isEmpty()
                ? summaryResponse.getPeerScores().stream().mapToDouble(CategoryScore::getAverageScore).average().orElse(0.0)
                : null;
        Double subordinateScore = summaryResponse.getSubordinateScores() != null && !summaryResponse.getSubordinateScores().isEmpty()
                ? summaryResponse.getSubordinateScores().stream().mapToDouble(CategoryScore::getAverageScore).average().orElse(0.0)
                : null;

        // Round averages
        if (selfScore != null) selfScore = Math.round(selfScore * 100.0) / 100.0;
        if (managerScore != null) managerScore = Math.round(managerScore * 100.0) / 100.0;
        if (peerScore != null) peerScore = Math.round(peerScore * 100.0) / 100.0;
        if (subordinateScore != null) subordinateScore = Math.round(subordinateScore * 100.0) / 100.0;

        FeedbackSummary summary = feedbackSummaryRepository
                .findByEmployeeIdAndCycleCycleId(targetUserId, cycleId).orElse(null);

        return Feedback360IndividualReportDTO.builder()
                .targetUserId(targetUserId)
                .targetUserName(employee.getStaffName())
                .employeeCode(employee.getEmployeeCode())
                .departmentName(ed != null ? ed.getCurrentDepartment().getDepartmentName() : "N/A")
                .positionName(employee.getPosition() != null ? employee.getPosition().getPositionName() : "N/A")
                .cycleName(summaryResponse.getCycleName())
                .selfScore(selfScore)
                .managerScore(managerScore)
                .peerScore(peerScore)
                .subordinateScore(subordinateScore)
                .finalScore(summaryResponse.getTotalAverageScore())
                .managerComments(summary != null ? summary.getManagerSummary() : "")
                .categoryScores(categoryScores)
                .comments(comments)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportIndividual360Report(Long targetUserId, Long cycleId, String format) {
        Feedback360IndividualReportDTO data = getIndividual360Report(targetUserId, cycleId);
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("reportTitle", "360° Feedback Individual Report");
        String jrxmlPath = "reports/feedback_360_individual_report.jrxml";
        return generateReport(jrxmlPath, parameters, List.of(data), format);
    }

    @Override
    @Transactional(readOnly = true)
    public Feedback360CycleSummaryReportDTO getCycle360SummaryReport(Long cycleId) {
        AppraisalCycle cycle = appraisalCycleRepository.findById(cycleId).orElse(null);
        String cycleName = cycle != null ? cycle.getCycleName() : "Cycle " + cycleId;

        List<FeedbackRequest> requests = feedbackRequestRepository.findByCycleCycleId(cycleId);
        long totalRequests = requests.size();
        long submittedRequests = requests.stream().filter(r -> "COMPLETED".equals(r.getStatus().name())).count();
        double submissionRate = totalRequests > 0 ? (double) submittedRequests / totalRequests * 100.0 : 0.0;
        submissionRate = Math.round(submissionRate * 100.0) / 100.0;

        List<FeedbackSummary> summaries = feedbackSummaryRepository.findByCycleCycleId(cycleId);
        long totalTargets = summaries.size();

        Map<String, List<Double>> deptScoresMap = new HashMap<>();
        for (FeedbackSummary fs : summaries) {
            if (fs.getEmployee() != null && fs.getFinalScore() != null) {
                Employee emp = fs.getEmployee();
                EmployeeDepartment ed = employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(emp.getId()).orElse(null);
                String deptName = (ed != null && ed.getCurrentDepartment() != null)
                        ? ed.getCurrentDepartment().getDepartmentName()
                        : "Unassigned";
                deptScoresMap.computeIfAbsent(deptName, k -> new ArrayList<>()).add(fs.getFinalScore().doubleValue());
            }
        }

        List<Feedback360DepartmentScoreDTO> deptScores = new ArrayList<>();
        for (Map.Entry<String, List<Double>> entry : deptScoresMap.entrySet()) {
            double avg = entry.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            avg = Math.round(avg * 100.0) / 100.0;
            deptScores.add(Feedback360DepartmentScoreDTO.builder()
                    .departmentName(entry.getKey())
                    .targetCount((long) entry.getValue().size())
                    .averageScore(avg)
                    .build());
        }

        deptScores.sort((a, b) -> Double.compare(b.getAverageScore(), a.getAverageScore()));

        return Feedback360CycleSummaryReportDTO.builder()
                .cycleId(cycleId)
                .cycleName(cycleName)
                .totalTargets(totalTargets)
                .totalRequests(totalRequests)
                .submittedRequests(submittedRequests)
                .submissionRate(submissionRate)
                .departmentScores(deptScores)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportCycle360SummaryReport(Long cycleId, String format) {
        Feedback360CycleSummaryReportDTO data = getCycle360SummaryReport(cycleId);
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("reportTitle", "360° Feedback Cycle Summary Report");
        String jrxmlPath = "reports/feedback_360_cycle_summary.jrxml";
        return generateReport(jrxmlPath, parameters, List.of(data), format);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportManagerReviewPack(Long managerId, Long cycleId, String format) {
        Employee manager = employeeRepository.findById(managerId)
                .orElseThrow(() -> new NotFoundException("Manager not found"));
        AppraisalCycle cycle = appraisalCycleRepository.findById(cycleId)
                .orElseThrow(() -> new NotFoundException("Cycle not found"));

        List<ReportingLine> subordinates = reportingLineRepository.findAllByManagerAndIsActiveTrue(manager);
        List<Feedback360ManagerPackItemDTO> items = new ArrayList<>();

        for (ReportingLine rl : subordinates) {
            Employee emp = rl.getEmployee();
            EmployeeDepartment ed = employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(emp.getId()).orElse(null);
            String deptName = (ed != null && ed.getCurrentDepartment() != null)
                    ? ed.getCurrentDepartment().getDepartmentName()
                    : "Unassigned";
            String posName = emp.getPosition() != null ? emp.getPosition().getPositionName() : "N/A";

            FeedbackSummary fs = feedbackSummaryRepository.findByEmployeeIdAndCycleCycleId(emp.getId(), cycleId).orElse(null);

            items.add(Feedback360ManagerPackItemDTO.builder()
                    .targetEmployeeName(emp.getStaffName())
                    .targetEmployeeCode(emp.getEmployeeCode())
                    .targetDepartmentName(deptName)
                    .targetPositionName(posName)
                    .selfScore(fs != null ? fs.getSelfScore() : null)
                    .managerScore(fs != null ? fs.getManagerScore() : null)
                    .peerScore(fs != null ? fs.getPeerScore() : null)
                    .subordinateScore(fs != null ? fs.getSubordinateScore() : null)
                    .finalScore(fs != null ? fs.getFinalScore() : null)
                    .calibratedFinalScore(fs != null ? fs.getCalibratedFinalScore() : null)
                    .managerSummary(fs != null ? fs.getManagerSummary() : null)
                    .build());
        }

        Feedback360ManagerPackDTO pack = Feedback360ManagerPackDTO.builder()
                .managerName(manager.getStaffName())
                .cycleName(cycle.getCycleName())
                .items(items)
                .build();

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("reportTitle", "360° Feedback Manager Review Pack");
        return generateReport("reports/feedback_360_manager_pack.jrxml", parameters, List.of(pack), format);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportPaperForm(Long requestId, String format) {
        FeedbackRequest req = feedbackRequestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Feedback request not found"));

        if (req.getForm() == null) {
            throw new RuntimeException("No form is assigned to this feedback request.");
        }

        Employee target = req.getTargetUser();
        EmployeeDepartment ed = employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(target.getId()).orElse(null);
        String deptName = (ed != null && ed.getCurrentDepartment() != null)
                ? ed.getCurrentDepartment().getDepartmentName()
                : "Unassigned";
        String posName = target.getPosition() != null ? target.getPosition().getPositionName() : "N/A";
        Employee evaluator = req.getEvaluator();
        EmployeeDepartment evaluatorDepartment = employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(evaluator.getId()).orElse(null);
        String evaluatorDeptName = (evaluatorDepartment != null && evaluatorDepartment.getCurrentDepartment() != null)
                ? evaluatorDepartment.getCurrentDepartment().getDepartmentName()
                : "Unassigned";
        String evaluatorPosName = evaluator.getPosition() != null ? evaluator.getPosition().getPositionName() : "N/A";

        Optional<Feedback> feedbackOpt = feedbackRepository.findByRequestId(requestId);
        List<FeedbackResponse> responses = feedbackOpt.isPresent() ? feedbackOpt.get().getResponses() : new ArrayList<>();

        List<Question> questions = questionRepository.findByCategory_Form_FormId(req.getForm().getFormId());
        List<Feedback360PaperFormQuestionDTO> questionDTOs = new ArrayList<>();
        for (Question q : questions) {
            FeedbackResponse resp = responses.stream()
                    .filter(r -> r.getQuestion().getQuestionId().equals(q.getQuestionId()))
                    .findFirst()
                    .orElse(null);

            questionDTOs.add(Feedback360PaperFormQuestionDTO.builder()
                    .categoryName(q.getCategory() != null ? q.getCategory().getCategoryName() : "General")
                    .questionText(q.getQuestionText())
                    .isRequired(q.getIsRequired())
                    .score(resp != null ? resp.getScore() : null)
                    .comment(resp != null ? resp.getComment() : null)
                    .build());
        }

        Feedback360PaperFormDTO formDTO = Feedback360PaperFormDTO.builder()
                .requestId(req.getId())
                .targetEmployeeName(target.getStaffName())
                .targetEmployeeCode(target.getEmployeeCode())
                .targetDepartmentName(deptName)
                .targetPositionName(posName)
                .evaluatorEmployeeName(req.getEvaluator().getStaffName())
                .relationshipType(req.getRelationship().name())
                .cycleName(req.getCycle().getCycleName())
                .questions(questionDTOs)
                .build();

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("reportTitle", "360 Feedback Paper Form");
        parameters.put("companyName", "ACE Data Systems");
        parameters.put("cycleName", formDTO.getCycleName());
        parameters.put("targetEmployeeName", formDTO.getTargetEmployeeName());
        parameters.put("targetEmployeeCode", formDTO.getTargetEmployeeCode());
        parameters.put("targetDepartmentName", formDTO.getTargetDepartmentName());
        parameters.put("targetPositionName", formDTO.getTargetPositionName());
        parameters.put("evaluatorEmployeeName", formDTO.getEvaluatorEmployeeName());
        parameters.put("evaluatorPositionName", evaluatorPosName);
        parameters.put("evaluatorDepartmentName", evaluatorDeptName);
        parameters.put("relationshipType", formDTO.getRelationshipType());
        parameters.put("assessmentDate", req.getCycle().getStartDate() != null ? req.getCycle().getStartDate().toString() : null);
        parameters.put("effectiveDate", req.getCycle().getEndDate() != null ? req.getCycle().getEndDate().toString() : null);
        parameters.put("totalScore", "");
        parameters.put("finalComment", "");
        return generateReport("reports/feedback_360_paper_form.jrxml", parameters, questionDTOs, format);
    }

    private byte[] generateReport(String jrxmlPath, Map<String, Object> parameters, List<?> data, String format) {
        if ("pdf".equalsIgnoreCase(format)) {
            return jasperReportUtil.generatePdfReport(jrxmlPath, parameters, data);
        } else {
            return jasperReportUtil.generateExcelReport(jrxmlPath, parameters, data);
        }
    }

    // -----------------------------------------------------------------------
    // Self-Assessment Form Export
    // -----------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public byte[] exportSelfAssessmentForm(Long appraisalId, String format) {
        Appraisal appraisal = appraisalRepository.findById(appraisalId)
                .orElseThrow(() -> new NotFoundException("Appraisal not found: " + appraisalId));

        if (appraisal.getStatus() != AppraisalStatus.HR_APPROVED &&
            appraisal.getStatus() != AppraisalStatus.FINALIZED &&
            appraisal.getStatus() != AppraisalStatus.ARCHIVED) {
            throw new InvalidAppraisalStateException(
                    "Self-assessment form can only be exported after the appraisal is approved or finalized.");
        }

        SelfAssessment self = selfAssessmentRepository.findByAppraisal_AppraisalId(appraisalId)
                .orElseThrow(() -> new NotFoundException("Self assessment not found for appraisal: " + appraisalId));

        EmployeeDepartment ed = employeeDepartmentRepository
                .findByEmployeeIdAndIsCurrentTrue(appraisal.getEmployee().getId()).orElse(null);

        AppraisalForm form = null;
        if (appraisal.getFormSet() != null) form = appraisal.getFormSet().getSelfAssessmentForm();
        if (form == null) {
            form = appraisal.getCycle().getForms().stream()
                    .filter(f -> f.getFormType() == FormType.SELF_ASSESSMENT)
                    .findFirst().orElse(null);
        }

        List<SelfAssessmentReportQuestionDTO> questions = new ArrayList<>();
        if (form != null) {
            List<Question> formQuestions =
                    questionRepository.findByCategory_Form_FormId(form.getFormId());
            Map<Long, SelfAssessmentAnswer> answerMap =
                    selfAssessmentAnswerRepository.findBySelfAssessment_SelfAssessmentId(self.getSelfAssessmentId())
                            .stream().collect(Collectors.toMap(
                                    a -> a.getQuestion().getQuestionId(), a -> a, (a, b) -> a));
            for (Question q : formQuestions) {
                SelfAssessmentAnswer ans = answerMap.get(q.getQuestionId());
                questions.add(ace.org.epms_backend.dto.report.SelfAssessmentReportQuestionDTO.builder()
                        .categoryName(q.getCategory() != null ? q.getCategory().getCategoryName() : "General")
                        .questionText(q.getQuestionText())
                        .isYes(ans != null && Boolean.TRUE.equals(ans.getIsCompleted()))
                        .isNo(ans != null && Boolean.FALSE.equals(ans.getIsCompleted()))
                        .ratingValue(ans != null ? ans.getRatingValue() : null)
                        .comment(ans != null ? ans.getComment() : null)
                        .build());
            }
        }

        String deptName = ed != null && ed.getCurrentDepartment() != null
                ? ed.getCurrentDepartment().getDepartmentName() : "N/A";
        String posName = appraisal.getEmployee().getPosition() != null
                ? appraisal.getEmployee().getPosition().getPositionName() : "N/A";
        String mgrName = appraisal.getManager() != null ? appraisal.getManager().getStaffName() : "N/A";
        String totalScore = self.getTotalScore() != null ? self.getTotalScore().toPlainString() + "%" : "N/A";
        String submittedAt = self.getSubmittedAt() != null ? self.getSubmittedAt().toString() : "N/A";

        Map<String, Object> params = new HashMap<>();
        params.put("reportTitle", "Self-Assessment Form");
        params.put("companyName", "ACE Data Systems");
        params.put("cycleName", appraisal.getCycle().getCycleName());
        params.put("employeeName", appraisal.getEmployee().getStaffName());
        params.put("employeeCode", appraisal.getEmployee().getEmployeeCode());
        params.put("departmentName", deptName);
        params.put("positionName", posName);
        params.put("managerName", mgrName);
        params.put("totalScore", totalScore);
        params.put("overallReflection", self.getOverallReflection() != null ? self.getOverallReflection() : "");
        params.put("assessmentDate", submittedAt);
        params.put("submittedAt", submittedAt);

        return generateReport("reports/self_assessment_form.jrxml", params, questions, format);
    }

    // -----------------------------------------------------------------------
    // Manager Evaluation Form Export
    // -----------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public byte[] exportManagerEvaluationForm(Long appraisalId, String format) {
        Appraisal appraisal = appraisalRepository.findById(appraisalId)
                .orElseThrow(() -> new NotFoundException("Appraisal not found: " + appraisalId));

        if (appraisal.getStatus() != ace.org.epms_backend.enums.AppraisalStatus.HR_APPROVED &&
            appraisal.getStatus() != ace.org.epms_backend.enums.AppraisalStatus.FINALIZED &&
            appraisal.getStatus() != ace.org.epms_backend.enums.AppraisalStatus.ARCHIVED) {
            throw new InvalidAppraisalStateException(
                    "Manager evaluation form can only be exported after the appraisal is approved or finalized.");
        }

        ManagerEvaluation eval = managerEvaluationRepository.findByAppraisal_AppraisalId(appraisalId)
                .orElseThrow(() -> new NotFoundException("Manager evaluation not found for appraisal: " + appraisalId));

        SelfAssessment self = selfAssessmentRepository.findByAppraisal_AppraisalId(appraisalId).orElse(null);

        EmployeeDepartment ed = employeeDepartmentRepository
                .findByEmployeeIdAndIsCurrentTrue(appraisal.getEmployee().getId()).orElse(null);

        ace.org.epms_backend.model.appraisal.AppraisalForm form = null;
        if (appraisal.getFormSet() != null) form = appraisal.getFormSet().getManagerEvaluationForm();
        if (form == null) {
            form = appraisal.getCycle().getForms().stream()
                    .filter(f -> f.getFormType() == ace.org.epms_backend.enums.FormType.MANAGER_EVALUATION)
                    .findFirst().orElse(null);
        }

        List<ace.org.epms_backend.dto.report.ManagerEvaluationReportQuestionDTO> questions = new ArrayList<>();
        if (form != null) {
            List<ace.org.epms_backend.model.appraisal.Question> formQuestions =
                    questionRepository.findByCategory_Form_FormId(form.getFormId());
            Map<Long, ManagerEvaluationAnswer> mgrMap =
                    managerEvaluationAnswerRepository.findByEvaluation_EvaluationId(eval.getEvaluationId())
                            .stream().collect(Collectors.toMap(
                                    a -> a.getQuestion().getQuestionId(), a -> a, (a, b) -> a));
            Map<Long, SelfAssessmentAnswer> selfMap = new HashMap<>();
            if (self != null) {
                selfAssessmentAnswerRepository.findBySelfAssessment_SelfAssessmentId(self.getSelfAssessmentId())
                        .forEach(a -> selfMap.put(a.getQuestion().getQuestionId(), a));
            }
            for (ace.org.epms_backend.model.appraisal.Question q : formQuestions) {
                ManagerEvaluationAnswer mgrAns = mgrMap.get(q.getQuestionId());
                SelfAssessmentAnswer selfAns = selfMap.get(q.getQuestionId());
                questions.add(ace.org.epms_backend.dto.report.ManagerEvaluationReportQuestionDTO.builder()
                        .categoryName(q.getCategory() != null ? q.getCategory().getCategoryName() : "General")
                        .questionText(q.getQuestionText())
                        .employeeRating(selfAns != null && selfAns.getRatingValue() != null
                                ? selfAns.getRatingValue().toString() : "-")
                        .employeeComment(selfAns != null ? selfAns.getComment() : null)
                        .managerRating(mgrAns != null && mgrAns.getRatingValue() != null
                                ? mgrAns.getRatingValue().toString() : "-")
                        .managerRatingValue(mgrAns != null ? mgrAns.getRatingValue() : null)
                        .managerComment(mgrAns != null ? mgrAns.getComment() : null)
                        .build());
            }
        }

        String deptName = ed != null && ed.getCurrentDepartment() != null
                ? ed.getCurrentDepartment().getDepartmentName() : "N/A";
        String posName = appraisal.getEmployee().getPosition() != null
                ? appraisal.getEmployee().getPosition().getPositionName() : "N/A";
        String mgrName = appraisal.getManager() != null ? appraisal.getManager().getStaffName() : "N/A";
        String totalScore = eval.getTotalScore() != null ? eval.getTotalScore().toPlainString() + "%" : "N/A";
        String submittedAt = eval.getSubmittedAt() != null ? eval.getSubmittedAt().toString() : "N/A";

        Map<String, Object> params = new HashMap<>();
        params.put("reportTitle", "Manager Evaluation Form");
        params.put("companyName", "ACE Data Systems");
        params.put("cycleName", appraisal.getCycle().getCycleName());
        params.put("employeeName", appraisal.getEmployee().getStaffName());
        params.put("employeeCode", appraisal.getEmployee().getEmployeeCode());
        params.put("departmentName", deptName);
        params.put("positionName", posName);
        params.put("managerName", mgrName);
        params.put("jobTitle", posName);
        params.put("assessmentDate", submittedAt);
        params.put("effectiveDate", appraisal.getFinalizedAt() != null ? appraisal.getFinalizedAt().toString() : submittedAt);
        params.put("totalScore", totalScore);
        params.put("finalComment", eval.getFinalComment() != null ? eval.getFinalComment() : "");
        params.put("submittedAt", submittedAt);

        return generateReport("reports/manager_evaluation_form.jrxml", params, questions, format);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportPipDetailReport(Long pipId, String format) {
        PipRecord pip = pipRecordRepository.findById(pipId)
                .orElseThrow(() -> new NotFoundException("PIP not found: " + pipId));

        // Guard: only export after the PIP is finalized
        if (pip.getStatus() != PipStatus.COMPLETED && pip.getStatus() != PipStatus.CLOSED) {
            throw new InvalidAppraisalStateException(
                    "PIP can only be exported after it is finalized (COMPLETED or CLOSED).");
        }

        // Subject info
        Employee employee = pip.getEmployee();
        EmployeeDepartment ed = employeeDepartmentRepository
                .findByEmployeeIdAndIsCurrentTrue(employee.getId()).orElse(null);

        // Objective rows
        List<PipObjective> objectives = pip.getObjectives();
        List<PipDetailReportObjectiveDTO> rows = objectives.stream()
                .map(o -> PipDetailReportObjectiveDTO.builder()
                        .objectiveTitle(o.getTitle())
                        .objectiveDescription(o.getDescription())
                        .successCriteria(o.getSuccessCriteria())
                        .progressPercent(pipProgressLogRepository
                                .findFirstByObjective_ObjectiveIdOrderByCreatedAtDesc(o.getObjectiveId())
                                .map(log -> log.getProgressPercent() != null ? log.getProgressPercent().toPlainString() + "%" : "0%")
                                .orElse("0%"))
                        .status(o.getStatus() != null ? o.getStatus().name() : "—")
                        .build())
                .toList();

        // Header params
        Map<String, Object> params = new HashMap<>();
        params.put("reportTitle", "Performance Improvement Plan");
        params.put("employeeName", employee.getStaffName());
        params.put("employeeCode", employee.getEmployeeCode());
        params.put("departmentName", ed != null && ed.getCurrentDepartment() != null
                ? ed.getCurrentDepartment().getDepartmentName() : "N/A");
        params.put("positionName", employee.getPosition() != null ? employee.getPosition().getPositionName() : "N/A");
        params.put("managerName", pip.getManager() != null ? pip.getManager().getStaffName() : "N/A");
        params.put("severity", pip.getSeverity() != null ? pip.getSeverity().name() : "—");
        params.put("status", pip.getStatus().name());
        params.put("outcome", pip.getFinalOutcome() != null ? pip.getFinalOutcome().name() : "—");
        params.put("startDate", pip.getStartDate() != null ? pip.getStartDate().toString() : "—");
        params.put("endDate", pip.getEndDate() != null ? pip.getEndDate().toString() : "—");
        params.put("reason", pip.getReason() != null ? pip.getReason() : "");
        params.put("overallComment", pip.getOverallComment() != null ? pip.getOverallComment() : "");

        return generateReport("reports/pip_detail_report.jrxml", params, rows, format);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentBreakdownDTO> getTeamPerformanceBreakdown(Long cycleId, Long departmentId) {
        List<DepartmentBreakdownDTO> result = new ArrayList<>();
        List<Employee> employees = (departmentId != null) 
            ? employeeDepartmentRepository.findByCurrentDepartmentIdAndIsCurrentTrue(departmentId).stream().map(EmployeeDepartment::getEmployee).collect(Collectors.toList())
            : employeeRepository.findAll();

        Map<String, Map<String, List<TeamMemberBreakdownDTO>>> grouped = new HashMap<>();

        for (Employee e : employees) {
            EmployeeDepartment ed = employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(e.getId()).orElse(null);
            String deptName = (ed != null && ed.getCurrentDepartment() != null) ? ed.getCurrentDepartment().getDepartmentName() : "No Department";
            
            EmployeeTeam et = employeeTeamRepository.findFirstByEmployeeIdAndIsPrimaryTrue(e.getId()).orElse(null);
            String tName = (et != null && et.getTeam() != null) ? et.getTeam().getTeamName() : "No Team";

            double score = appraisalSummaryRepository.findByEmployee_IdAndCycle_CycleId(e.getId(), cycleId)
                            .map(s -> s.getTotalScore() != null ? s.getTotalScore().doubleValue() : 0.0)
                            .orElse(0.0);

            if (score > 0) {
                TeamMemberBreakdownDTO member = TeamMemberBreakdownDTO.builder()
                        .employeeId(e.getId())
                        .employeeName(e.getStaffName())
                        .role(e.getPosition() != null ? e.getPosition().getPositionName() : "Employee")
                        .averageScore(roundDouble(score))
                        .build();

                grouped.computeIfAbsent(deptName, k -> new HashMap<>())
                       .computeIfAbsent(tName, k -> new ArrayList<>())
                       .add(member);
            }
        }

        for (Map.Entry<String, Map<String, List<TeamMemberBreakdownDTO>>> deptEntry : grouped.entrySet()) {
            List<TeamBreakdownDTO> teamBreakdowns = new ArrayList<>();
            double totalDeptScore = 0;
            int totalDeptMembers = 0;

            for (Map.Entry<String, List<TeamMemberBreakdownDTO>> teamEntry : deptEntry.getValue().entrySet()) {
                List<TeamMemberBreakdownDTO> members = teamEntry.getValue();
                double teamAvg = members.stream().mapToDouble(TeamMemberBreakdownDTO::getAverageScore).average().orElse(0.0);
                
                teamBreakdowns.add(TeamBreakdownDTO.builder()
                        .teamName(teamEntry.getKey())
                        .averageScore(roundDouble(teamAvg))
                        .members(members)
                        .build());
                        
                totalDeptScore += members.stream().mapToDouble(TeamMemberBreakdownDTO::getAverageScore).sum();
                totalDeptMembers += members.size();
            }

            double deptAvg = totalDeptMembers > 0 ? totalDeptScore / totalDeptMembers : 0.0;
            
            result.add(DepartmentBreakdownDTO.builder()
                    .departmentName(deptEntry.getKey())
                    .averageScore(roundDouble(deptAvg))
                    .teams(teamBreakdowns)
                    .build());
        }

        result.sort((a, b) -> Double.compare(b.getAverageScore(), a.getAverageScore()));
        return result;
    }

    @Override
    public byte[] exportTeamPerformanceBreakdown(Long cycleId, Long departmentId, String format) {
        List<DepartmentBreakdownDTO> data = getTeamPerformanceBreakdown(cycleId, departmentId);
        
        List<TeamPerformanceBreakdownFlatDTO> flatData = new ArrayList<>();
        for (DepartmentBreakdownDTO dept : data) {
            for (TeamBreakdownDTO team : dept.getTeams()) {
                for (TeamMemberBreakdownDTO member : team.getMembers()) {
                    flatData.add(TeamPerformanceBreakdownFlatDTO.builder()
                            .departmentName(dept.getDepartmentName())
                            .departmentAverage(dept.getAverageScore())
                            .teamName(team.getTeamName())
                            .teamAverage(team.getAverageScore())
                            .employeeName(member.getEmployeeName())
                            .role(member.getRole())
                            .averageScore(member.getAverageScore())
                            .build());
                }
            }
        }

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("reportTitle", "Team Performance Breakdown");
        parameters.put("cycleId", cycleId);
        String jrxmlPath = "reports/team_performance_breakdown.jrxml";
        return generateReport(jrxmlPath, parameters, flatData, format);
    }
}
