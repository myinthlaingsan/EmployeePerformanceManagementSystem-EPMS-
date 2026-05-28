package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.audit.*;
import ace.org.epms_backend.enums.ReportType;
import org.springframework.data.domain.Page;

import java.io.IOException;
import java.io.OutputStream;
import java.time.LocalDate;
import java.util.List;

public interface AuditLogService {
    Page<AuditLogDTO> getAuditLogs(AuditFilterCriteria criteria);

    AuditLogDetailDTO getAuditLogDetail(Long auditId);

    List<AuditChangeDTO> getEntityChangeHistory(String tableName, Long recordId);

    AuditSummaryDTO getAuditSummary(Long employeeId, LocalDateRange dateRange);

    AuditLogReportDTO generateReport(ReportType type, LocalDateRange range);

    AuditStatisticsDTO getStatistics(LocalDate fromDate, LocalDate toDate);

    Page<UserActivityDTO> getUserActivity(Long userId, int page, int size);

    void exportToCSV(AuditFilterCriteria criteria, OutputStream output) throws IOException;

    void exportToPDF(ReportType reportType, LocalDateRange dateRange, OutputStream output) throws IOException;
}
