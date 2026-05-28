package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.audit.*;
import ace.org.epms_backend.enums.AuditAction;
import ace.org.epms_backend.enums.AuditStatus;
import ace.org.epms_backend.enums.ReportType;
import ace.org.epms_backend.enums.SortDirection;
import ace.org.epms_backend.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','AUDIT_VIEWER')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AuditLogDTO>>> getAuditLogs(
            @RequestParam(required = false) String tableName,
            @RequestParam(required = false) Long recordId,
            @RequestParam(required = false) Long changedBy,
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) AuditStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "changedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") SortDirection sortDirection) {

        AuditFilterCriteria criteria = AuditFilterCriteria.builder()
                .tableName(tableName)
                .recordId(recordId)
                .changedByUserId(changedBy)
                .action(action)
                .status(status)
                .dateRange(toDateRange(startDate, endDate))
                .pageNumber(page)
                .pageSize(size)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .build();

        return ResponseEntity.ok(ApiResponse.success(auditLogService.getAuditLogs(criteria)));
    }

    @GetMapping("/{auditId}")
    public ResponseEntity<ApiResponse<AuditLogDetailDTO>> getAuditLogDetail(@PathVariable Long auditId) {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getAuditLogDetail(auditId)));
    }

    @GetMapping("/entity/{tableName}/{recordId}")
    public ResponseEntity<ApiResponse<List<AuditChangeDTO>>> getEntityHistory(
            @PathVariable String tableName,
            @PathVariable Long recordId) {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getEntityChangeHistory(tableName, recordId)));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AuditSummaryDTO>> getAuditSummary(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getAuditSummary(employeeId, toDateRange(startDate, endDate))));
    }

    @GetMapping("/reports/{reportType}")
    public ResponseEntity<ApiResponse<AuditLogReportDTO>> generateReport(
            @PathVariable ReportType reportType,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(ApiResponse.success(
                auditLogService.generateReport(reportType, new LocalDateRange(fromDate, toDate))));
    }

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<AuditStatisticsDTO>> getStatistics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getStatistics(fromDate, toDate)));
    }

    @GetMapping("/user/{userId}/activity")
    public ResponseEntity<ApiResponse<Page<UserActivityDTO>>> getUserActivity(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getUserActivity(userId, page, size)));
    }

    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportCSV(
            @RequestParam(required = false) String tableName,
            @RequestParam(required = false) Long changedBy,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        auditLogService.exportToCSV(exportCriteria(tableName, changedBy, fromDate, toDate), output);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"audit-log-" + fromDate + "-to-" + toDate + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(output.toByteArray());
    }

    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPDF(
            @RequestParam ReportType reportType,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        auditLogService.exportToPDF(reportType, new LocalDateRange(fromDate, toDate), output);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"audit-report-" + fromDate + "-to-" + toDate + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(output.toByteArray());
    }

    private AuditFilterCriteria exportCriteria(String tableName, Long changedBy, LocalDate fromDate, LocalDate toDate) {
        return AuditFilterCriteria.builder()
                .tableName(tableName)
                .changedByUserId(changedBy)
                .dateRange(new LocalDateRange(fromDate, toDate))
                .pageNumber(0)
                .pageSize(Integer.MAX_VALUE)
                .sortBy("changedAt")
                .sortDirection(SortDirection.DESC)
                .build();
    }

    private LocalDateRange toDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        if (startDate == null || endDate == null) {
            return null;
        }
        return new LocalDateRange(startDate.toLocalDate(), endDate.toLocalDate());
    }
}
