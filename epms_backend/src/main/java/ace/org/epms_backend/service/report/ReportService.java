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
}
