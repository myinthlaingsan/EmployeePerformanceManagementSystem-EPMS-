package ace.org.epms_backend.service.report;

import ace.org.epms_backend.dto.report.*;
import java.util.List;

public interface ReportService {
    // KPI Achievement
    List<KpiAchievementReportDTO> getKpiAchievementReport(Long cycleId, Long departmentId);
    byte[] exportKpiAchievementReport(Long cycleId, Long departmentId, String format);

    // Appraisal Status
    AppraisalStatusReportDTO getAppraisalStatusReport(Long cycleId);
    byte[] exportAppraisalStatusReport(Long cycleId, String format);

    // Performance Trend
    PerformanceTrendReportDTO getPerformanceTrendReport(Long employeeId);
    byte[] exportPerformanceTrendReport(Long employeeId, String format);

    // 360 Feedback
    FeedbackParticipationReportDTO getFeedbackParticipationReport(Long cycleId);
    byte[] exportFeedbackParticipationReport(Long cycleId, String format);

    // PIP Tracking
    PipTrackingReportDTO getPipTrackingReport();
    byte[] exportPipTrackingReport(String format);

    // Audit Trail
    List<AuditTrailReportDTO> getAuditTrailReport(String tableName, Long recordId);
    byte[] exportAuditTrailReport(String tableName, Long recordId, String format);

    // Department Comparison
    List<DeptPerformanceReportDTO> getDeptPerformanceComparison(Long cycleId);
    byte[] exportDeptPerformanceComparison(Long cycleId, String format);

    // Promotion Readiness
    List<PromotionReadinessReportDTO> getPromotionReadinessReport();
    byte[] exportPromotionReadinessReport(String format);

    // Employee Performance Summary
    EmployeePerformanceSummaryDTO getEmployeePerformanceSummary(Long employeeId, Long cycleId);
    byte[] exportEmployeePerformanceSummary(Long employeeId, Long cycleId, String format);

    // High/Low Performers
    List<PerformanceRankingReportDTO> getPerformanceRankingReport(Long cycleId);
    byte[] exportPerformanceRankingReport(Long cycleId, String format);

    byte[] exportEmployeeMasterReport(Long departmentId, Long teamId, String format);

    // Individual 360 Feedback PDF Report
    Feedback360IndividualReportDTO getIndividual360Report(Long targetUserId, Long cycleId);
    byte[] exportIndividual360Report(Long targetUserId, Long cycleId, String format);

    // Cycle 360 Feedback Summary Report
    Feedback360CycleSummaryReportDTO getCycle360SummaryReport(Long cycleId);
    byte[] exportCycle360SummaryReport(Long cycleId, String format);

    // Manager Review Pack and Printable Paper Form
    byte[] exportManagerReviewPack(Long managerId, Long cycleId, String format);
    byte[] exportPaperForm(Long requestId, String format);
}
