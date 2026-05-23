package ace.org.epms_backend.controller.report;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.report.*;
import ace.org.epms_backend.service.report.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/kpi-achievement")
    public ResponseEntity<ApiResponse<List<KpiAchievementReportDTO>>> getKpiAchievementReport(
            @RequestParam Long cycleId,
            @RequestParam(required = false) Long departmentId) {
        List<KpiAchievementReportDTO> data = reportService.getKpiAchievementReport(cycleId, departmentId);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/kpi-achievement/download")
    public ResponseEntity<byte[]> downloadKpiAchievementReport(
            @RequestParam Long cycleId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(defaultValue = "pdf") String format) {
        byte[] reportContent = reportService.exportKpiAchievementReport(cycleId, departmentId, format);
        return createDownloadResponse(reportContent, "KPI_Achievement_Report", format);
    }

    // Appraisal Status
    @GetMapping("/appraisal-status")
    public ResponseEntity<ApiResponse<AppraisalStatusReportDTO>> getAppraisalStatusReport(@RequestParam Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getAppraisalStatusReport(cycleId)));
    }

    @GetMapping("/appraisal-status/download")
    public ResponseEntity<byte[]> downloadAppraisalStatusReport(@RequestParam Long cycleId,
            @RequestParam(defaultValue = "pdf") String format) {
        byte[] reportContent = reportService.exportAppraisalStatusReport(cycleId, format);
        return createDownloadResponse(reportContent, "Appraisal_Status_Report", format);
    }

    // Performance Trend
    @GetMapping("/performance-trend")
    public ResponseEntity<ApiResponse<PerformanceTrendReportDTO>> getPerformanceTrendReport(
            @RequestParam Long employeeId) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getPerformanceTrendReport(employeeId)));
    }

    @GetMapping("/performance-trend/download")
    public ResponseEntity<byte[]> downloadPerformanceTrendReport(@RequestParam Long employeeId,
            @RequestParam(defaultValue = "pdf") String format) {
        byte[] reportContent = reportService.exportPerformanceTrendReport(employeeId, format);
        return createDownloadResponse(reportContent, "Performance_Trend_Report", format);
    }

    // 360 Feedback
    @GetMapping("/feedback-participation")
    public ResponseEntity<ApiResponse<FeedbackParticipationReportDTO>> getFeedbackParticipationReport(
            @RequestParam Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getFeedbackParticipationReport(cycleId)));
    }

    @GetMapping("/feedback-participation/download")
    public ResponseEntity<byte[]> downloadFeedbackParticipationReport(@RequestParam Long cycleId,
            @RequestParam(defaultValue = "pdf") String format) {
        byte[] reportContent = reportService.exportFeedbackParticipationReport(cycleId, format);
        return createDownloadResponse(reportContent, "Feedback_Participation_Report", format);
    }

    @GetMapping("/feedback-360/download")
    public ResponseEntity<byte[]> downloadIndividual360Report(
            @RequestParam Long targetUserId,
            @RequestParam Long cycleId,
            @RequestParam(defaultValue = "pdf") String format) {
        byte[] reportContent = reportService.exportIndividual360Report(targetUserId, cycleId, format);
        return createDownloadResponse(reportContent, "Feedback_360_Individual_Report", format);
    }

    @GetMapping("/feedback-360/cycle/download")
    public ResponseEntity<byte[]> downloadCycle360SummaryReport(
            @RequestParam Long cycleId,
            @RequestParam(defaultValue = "pdf") String format) {
        byte[] reportContent = reportService.exportCycle360SummaryReport(cycleId, format);
        return createDownloadResponse(reportContent, "Feedback_360_Cycle_Summary_Report", format);
    }

    @GetMapping("/feedback-360/manager/download")
    public ResponseEntity<byte[]> downloadManagerReviewPack(
            @RequestParam Long managerId,
            @RequestParam Long cycleId,
            @RequestParam(defaultValue = "pdf") String format) {
        byte[] reportContent = reportService.exportManagerReviewPack(managerId, cycleId, format);
        return createDownloadResponse(reportContent, "Feedback_360_Manager_Pack", format);
    }

    @GetMapping("/feedback-360/print-form/download")
    public ResponseEntity<byte[]> downloadPaperForm(
            @RequestParam Long requestId,
            @RequestParam(defaultValue = "pdf") String format) {
        byte[] reportContent = reportService.exportPaperForm(requestId, format);
        return createDownloadResponse(reportContent, "Feedback_360_Paper_Form", format);
    }

    // PIP Tracking
    @GetMapping("/pip-tracking")
    public ResponseEntity<ApiResponse<PipTrackingReportDTO>> getPipTrackingReport() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getPipTrackingReport()));
    }

    @GetMapping("/pip-tracking/download")
    public ResponseEntity<byte[]> downloadPipTrackingReport(@RequestParam(defaultValue = "pdf") String format) {
        byte[] reportContent = reportService.exportPipTrackingReport(format);
        return createDownloadResponse(reportContent, "PIP_Tracking_Report", format);
    }

    // Audit Trail
    @GetMapping("/audit-trail")
    public ResponseEntity<ApiResponse<List<AuditTrailReportDTO>>> getAuditTrailReport(
            @RequestParam(required = false) String tableName,
            @RequestParam(required = false) Long recordId) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getAuditTrailReport(tableName, recordId)));
    }

    @GetMapping("/audit-trail/download")
    public ResponseEntity<byte[]> downloadAuditTrailReport(
            @RequestParam(required = false) String tableName,
            @RequestParam(required = false) Long recordId,
            @RequestParam(defaultValue = "pdf") String format) {
        byte[] reportContent = reportService.exportAuditTrailReport(tableName, recordId, format);
        return createDownloadResponse(reportContent, "Audit_Trail_Report", format);
    }

    // Department Comparison
    @GetMapping("/dept-comparison")
    public ResponseEntity<ApiResponse<List<DeptPerformanceReportDTO>>> getDeptPerformanceComparison(
            @RequestParam Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getDeptPerformanceComparison(cycleId)));
    }

    @GetMapping("/dept-comparison/download")
    public ResponseEntity<byte[]> downloadDeptPerformanceComparison(@RequestParam Long cycleId,
            @RequestParam(defaultValue = "pdf") String format) {
        byte[] reportContent = reportService.exportDeptPerformanceComparison(cycleId, format);
        return createDownloadResponse(reportContent, "Dept_Performance_Comparison", format);
    }

    // Promotion Readiness
    @GetMapping("/promotion-readiness")
    public ResponseEntity<ApiResponse<List<PromotionReadinessReportDTO>>> getPromotionReadinessReport() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getPromotionReadinessReport()));
    }

    @GetMapping("/promotion-readiness/download")
    public ResponseEntity<byte[]> downloadPromotionReadinessReport(@RequestParam(defaultValue = "pdf") String format) {
        byte[] reportContent = reportService.exportPromotionReadinessReport(format);
        return createDownloadResponse(reportContent, "Promotion_Readiness_Report", format);
    }

    // Employee Performance Summary
    @GetMapping("/performance-summary")
    public ResponseEntity<ApiResponse<EmployeePerformanceSummaryDTO>> getEmployeePerformanceSummary(
            @RequestParam Long employeeId,
            @RequestParam Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getEmployeePerformanceSummary(employeeId, cycleId)));
    }

    @GetMapping("/performance-summary/download")
    public ResponseEntity<byte[]> downloadEmployeePerformanceSummary(
            @RequestParam Long employeeId,
            @RequestParam Long cycleId,
            @RequestParam(defaultValue = "pdf") String format) {
        byte[] reportContent = reportService.exportEmployeePerformanceSummary(employeeId, cycleId, format);
        return createDownloadResponse(reportContent, "Performance_Summary_Report", format);
    }

    // High/Low Performers
    @GetMapping("/performance-ranking")
    public ResponseEntity<ApiResponse<List<PerformanceRankingReportDTO>>> getPerformanceRankingReport(
            @RequestParam Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getPerformanceRankingReport(cycleId)));
    }

    @GetMapping("/performance-ranking/download")
    public ResponseEntity<byte[]> downloadPerformanceRankingReport(
            @RequestParam Long cycleId,
            @RequestParam(defaultValue = "pdf") String format) {
        byte[] reportContent = reportService.exportPerformanceRankingReport(cycleId, format);
        return createDownloadResponse(reportContent, "Performance_Ranking_Report", format);
    }

    @GetMapping("/employees/download")
    public ResponseEntity<byte[]> downloadEmployeeMasterReport(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long teamId,
            @RequestParam(defaultValue = "pdf") String format) {
        byte[] reportContent = reportService.exportEmployeeMasterReport(departmentId, teamId, format);
        return createDownloadResponse(reportContent, "Employee_Master_Report", format);
    }

    @GetMapping("/self-assessment/download")
    public ResponseEntity<byte[]> downloadSelfAssessmentForm(
            @RequestParam Long appraisalId,
            @RequestParam(defaultValue = "pdf") String format) {
        byte[] content = reportService.exportSelfAssessmentForm(appraisalId, format);
        return createDownloadResponse(content, "Self_Assessment_Form", format);
    }

    @GetMapping("/manager-evaluation/download")
    public ResponseEntity<byte[]> downloadManagerEvaluationForm(
            @RequestParam Long appraisalId,
            @RequestParam(defaultValue = "pdf") String format) {
        byte[] content = reportService.exportManagerEvaluationForm(appraisalId, format);
        return createDownloadResponse(content, "Manager_Evaluation_Form", format);
    }

    @GetMapping("/pip-detail/download")
    public ResponseEntity<byte[]> downloadPipDetailReport(
            @RequestParam Long pipId,
            @RequestParam(defaultValue = "pdf") String format) {
        byte[] content = reportService.exportPipDetailReport(pipId, format);
        return createDownloadResponse(content, "PIP_Detail_Report", format);
    }

    private ResponseEntity<byte[]> createDownloadResponse(byte[] content, String baseName, String format) {
        String fileName = baseName + "." + format.toLowerCase();
        MediaType mediaType = "pdf".equalsIgnoreCase(format) ? MediaType.APPLICATION_PDF
                : MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(mediaType)
                .body(content);
    }
}
