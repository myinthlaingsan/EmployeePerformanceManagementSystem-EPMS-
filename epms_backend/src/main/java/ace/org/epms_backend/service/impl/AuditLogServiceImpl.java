package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.audit.*;
import ace.org.epms_backend.dto.report.AuditTrailReportDTO;
import ace.org.epms_backend.enums.*;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.AuditLogMapper;
import ace.org.epms_backend.model.AuditLog;
import ace.org.epms_backend.repository.AuditLogRepository;
import ace.org.epms_backend.service.AuditLogService;
import ace.org.epms_backend.specification.AuditLogSpecification;
import ace.org.epms_backend.util.JasperReportUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuditLogServiceImpl implements AuditLogService {

    private static final List<String> CSV_HEADERS = List.of(
            "Audit ID", "Table", "Record ID", "Action", "Changed By", "Changed At", "IP Address", "Status");

    private final AuditLogRepository auditLogRepository;
    private final AuditLogMapper auditLogMapper;
    private final ObjectMapper objectMapper;
    private final JasperReportUtil jasperReportUtil;

    @Override
    public Page<AuditLogDTO> getAuditLogs(AuditFilterCriteria criteria) {
        AuditFilterCriteria normalized = normalizeCriteria(criteria);
        Pageable pageable = PageRequest.of(
                normalized.getPageNumber(),
                normalized.getPageSize(),
                Sort.by(toSpringDirection(normalized.getSortDirection()), normalized.getSortBy()));

        return auditLogRepository
                .findAll(AuditLogSpecification.byCriteria(normalized), pageable)
                .map(auditLogMapper::toDTO);
    }

    @Override
    public AuditLogDetailDTO getAuditLogDetail(Long auditId) {
        AuditLog log = auditLogRepository.findById(auditId)
                .orElseThrow(() -> new NotFoundException("Audit log not found"));
        return auditLogMapper.toDetailDTO(log, parseFieldChanges(log.getOldValues(), log.getNewValues()));
    }

    @Override
    public List<AuditChangeDTO> getEntityChangeHistory(String tableName, Long recordId) {
        List<AuditLog> auditLogs = auditLogRepository.findByTableNameAndRecordIdOrderByChangedAtDesc(tableName, recordId);
        List<AuditChangeDTO> changes = new ArrayList<>();
        for (int i = 0; i < auditLogs.size(); i++) {
            AuditLog log = auditLogs.get(i);
            changes.add(auditLogMapper.toChangeDTO(
                    log,
                    i + 1,
                    parseFieldChanges(log.getOldValues(), log.getNewValues())));
        }
        return changes;
    }

    @Override
    public AuditSummaryDTO getAuditSummary(Long employeeId, LocalDateRange dateRange) {
        AuditFilterCriteria criteria = AuditFilterCriteria.builder()
                .changedByUserId(employeeId)
                .dateRange(defaultDateRange(dateRange))
                .pageNumber(0)
                .pageSize(Integer.MAX_VALUE)
                .sortBy("changedAt")
                .sortDirection(SortDirection.DESC)
                .build();

        List<AuditLog> auditLogs = auditLogRepository.findAll(AuditLogSpecification.byCriteria(criteria));
        return buildSummaryFromLogs(auditLogs);
    }

    @Override
    public AuditStatisticsDTO getStatistics(LocalDate fromDate, LocalDate toDate) {
        LocalDateRange range = defaultDateRange(new LocalDateRange(fromDate, toDate));
        AuditFilterCriteria criteria = AuditFilterCriteria.builder()
                .dateRange(range)
                .build();

        List<AuditLog> auditLogs = auditLogRepository.findAll(AuditLogSpecification.byCriteria(criteria));
        long daysBetween = Math.max(1, ChronoUnit.DAYS.between(range.getStartDate(), range.getEndDate()) + 1);
        double averageChangesPerDay = Math.round((auditLogs.size() / (double) daysBetween) * 100.0) / 100.0;

        return AuditStatisticsDTO.builder()
                .totalAuditEntries((long) auditLogs.size())
                .actionDistribution(auditLogs.stream()
                        .collect(Collectors.groupingBy(AuditLog::getAction, Collectors.counting())))
                .tableModificationCounts(auditLogs.stream()
                        .collect(Collectors.groupingBy(AuditLog::getTableName, Collectors.counting())))
                .userActivityCounts(auditLogs.stream()
                        .collect(Collectors.groupingBy(log -> auditLogMapper.resolveEmployeeName(log.getChangedBy()), Collectors.counting())))
                .averageChangesPerDay(averageChangesPerDay)
                .riskMetrics(calculateRiskMetrics(auditLogs))
                .build();
    }

    @Override
    public AuditLogReportDTO generateReport(ReportType type, LocalDateRange range) {
        LocalDateRange normalizedRange = defaultDateRange(range);
        List<AuditLog> logs = auditLogRepository.findAll(AuditLogSpecification.byCriteria(
                AuditFilterCriteria.builder().dateRange(normalizedRange).build()));

        List<AuditChangeDTO> details = new ArrayList<>();
        for (int i = 0; i < logs.size(); i++) {
            AuditLog log = logs.get(i);
            details.add(auditLogMapper.toChangeDTO(log, i + 1, parseFieldChanges(log.getOldValues(), log.getNewValues())));
        }

        return AuditLogReportDTO.builder()
                .reportDate(LocalDate.now())
                .dateRange(normalizedRange)
                .reportType(type)
                .summary(buildSummaryFromLogs(logs))
                .details(details)
                .riskIndicators(identifyRiskIndicators(logs))
                .generatedAt(Instant.now())
                .build();
    }

    @Override
    public Page<UserActivityDTO> getUserActivity(Long userId, int page, int size) {
        AuditFilterCriteria criteria = AuditFilterCriteria.builder()
                .changedByUserId(userId)
                .pageNumber(page)
                .pageSize(size)
                .sortBy("changedAt")
                .sortDirection(SortDirection.DESC)
                .build();

        return auditLogRepository.findAll(AuditLogSpecification.byCriteria(criteria),
                        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "changedAt")))
                .map(this::toUserActivityDTO);
    }

    @Override
    public void exportToCSV(AuditFilterCriteria criteria, OutputStream output) throws IOException {
        AuditFilterCriteria normalized = normalizeCriteria(criteria);
        normalized.setPageNumber(0);
        normalized.setPageSize(Integer.MAX_VALUE);

        List<AuditLogDTO> rows = getAuditLogs(normalized).getContent();
        StringBuilder csv = new StringBuilder();
        csv.append(CSV_HEADERS.stream().map(this::csvValue).collect(Collectors.joining(","))).append("\n");
        for (AuditLogDTO row : rows) {
            csv.append(List.of(
                    csvValue(row.getAuditId()),
                    csvValue(row.getTableName()),
                    csvValue(row.getRecordId()),
                    csvValue(row.getAction()),
                    csvValue(row.getChangedByName()),
                    csvValue(row.getChangedAt()),
                    csvValue(row.getIpAddress()),
                    csvValue(row.getStatus()))
                    .stream()
                    .collect(Collectors.joining(",")))
                    .append("\n");
        }
        output.write(csv.toString().getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public void exportToPDF(ReportType reportType, LocalDateRange dateRange, OutputStream output) throws IOException {
        LocalDateRange range = defaultDateRange(dateRange);
        List<AuditLog> logs = auditLogRepository.findAll(AuditLogSpecification.byCriteria(
                AuditFilterCriteria.builder().dateRange(range).build()));
        List<AuditTrailReportDTO> rows = logs.stream()
                .map(log -> AuditTrailReportDTO.builder()
                        .tableName(log.getTableName())
                        .action(log.getAction().name())
                        .changedBy(auditLogMapper.resolveEmployeeName(log.getChangedBy()))
                        .changedAt(log.getChangedAt() != null ? log.getChangedAt().toString() : "")
                        .oldValues(log.getOldValues())
                        .newValues(log.getNewValues())
                        .build())
                .toList();

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("reportTitle", "Audit Log Report");
        byte[] bytes = jasperReportUtil.generatePdfReport("reports/audit_trail_report.jrxml", parameters, rows);
        output.write(bytes);
    }

    private AuditFilterCriteria normalizeCriteria(AuditFilterCriteria criteria) {
        AuditFilterCriteria normalized = criteria == null ? new AuditFilterCriteria() : criteria;
        if (normalized.getPageNumber() == null || normalized.getPageNumber() < 0) {
            normalized.setPageNumber(0);
        }
        if (normalized.getPageSize() == null || normalized.getPageSize() < 1) {
            normalized.setPageSize(20);
        }
        if (normalized.getSortBy() == null || normalized.getSortBy().isBlank()) {
            normalized.setSortBy("changedAt");
        }
        if (normalized.getSortDirection() == null) {
            normalized.setSortDirection(SortDirection.DESC);
        }
        return normalized;
    }

    private Sort.Direction toSpringDirection(SortDirection direction) {
        return direction == SortDirection.ASC ? Sort.Direction.ASC : Sort.Direction.DESC;
    }

    private LocalDateRange defaultDateRange(LocalDateRange range) {
        if (range == null || range.getStartDate() == null || range.getEndDate() == null) {
            return new LocalDateRange(LocalDate.now().minusDays(30), LocalDate.now());
        }
        return range;
    }

    private AuditSummaryDTO buildSummaryFromLogs(List<AuditLog> auditLogs) {
        return AuditSummaryDTO.builder()
                .totalChanges((long) auditLogs.size())
                .createdCount(auditLogs.stream().filter(log -> log.getAction() == AuditAction.CREATE || log.getAction() == AuditAction.INSERT).count())
                .updatedCount(auditLogs.stream().filter(log -> log.getAction() == AuditAction.UPDATE).count())
                .deletedCount(auditLogs.stream().filter(log -> log.getAction() == AuditAction.DELETE).count())
                .accessedCount(auditLogs.stream().filter(log -> log.getAction() == AuditAction.ACCESS).count())
                .changesByTable(auditLogs.stream().collect(Collectors.groupingBy(AuditLog::getTableName, Collectors.counting())))
                .changesByUser(auditLogs.stream().collect(Collectors.groupingBy(log -> auditLogMapper.resolveEmployeeName(log.getChangedBy()), Collectors.counting())))
                .oldestChange(auditLogs.stream().map(AuditLog::getChangedAt).filter(Objects::nonNull).min(Comparator.naturalOrder()).orElse(null))
                .latestChange(auditLogs.stream().map(AuditLog::getChangedAt).filter(Objects::nonNull).max(Comparator.naturalOrder()).orElse(null))
                .build();
    }

    private Map<String, FieldChangeDTO> parseFieldChanges(String oldValuesJson, String newValuesJson) {
        Map<String, Object> oldValues = readJsonMap(oldValuesJson);
        Map<String, Object> newValues = readJsonMap(newValuesJson);
        Set<String> fields = new LinkedHashSet<>();
        fields.addAll(oldValues.keySet());
        fields.addAll(newValues.keySet());

        Map<String, FieldChangeDTO> changes = new LinkedHashMap<>();
        for (String field : fields) {
            Object oldValue = oldValues.get(field);
            Object newValue = newValues.get(field);
            if (!Objects.equals(oldValue, newValue)) {
                changes.put(field, FieldChangeDTO.builder()
                        .fieldName(field)
                        .oldValue(valueToString(oldValue))
                        .newValue(valueToString(newValue))
                        .dataType(newValue != null ? newValue.getClass().getSimpleName() : "unknown")
                        .build());
            }
        }
        return changes;
    }

    private Map<String, Object> readJsonMap(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception ex) {
            return Map.of("raw", json);
        }
    }

    private String valueToString(Object value) {
        if (value == null) {
            return "null";
        }
        if (value instanceof String string) {
            return string;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            return String.valueOf(value);
        }
    }

    private RiskMetricsDTO calculateRiskMetrics(List<AuditLog> auditLogs) {
        if (auditLogs.isEmpty()) {
            return RiskMetricsDTO.builder()
                    .failureRate(0.0)
                    .bulkOperationCount(0L)
                    .unusualAccessPatterns(0L)
                    .build();
        }

        long failureCount = auditLogs.stream().filter(this::isFailure).count();
        double failureRate = Math.round((failureCount / (double) auditLogs.size()) * 10000.0) / 100.0;
        long bulkOperationCount = auditLogs.stream()
                .collect(Collectors.groupingBy(log -> auditLogMapper.resolveEmployeeName(log.getChangedBy()) + "|" + log.getTableName(), Collectors.counting()))
                .values().stream()
                .filter(count -> count >= 20)
                .count();
        long unusualAccessPatterns = auditLogs.stream()
                .filter(log -> log.getAction() == AuditAction.ACCESS)
                .filter(log -> {
                    LocalDateTime local = LocalDateTime.ofInstant(log.getChangedAt(), ZoneId.systemDefault());
                    return local.getHour() < 6 || local.getHour() > 22;
                })
                .count();

        return RiskMetricsDTO.builder()
                .failureRate(failureRate)
                .bulkOperationCount(bulkOperationCount)
                .unusualAccessPatterns(unusualAccessPatterns)
                .build();
    }

    private List<RiskIndicatorDTO> identifyRiskIndicators(List<AuditLog> auditLogs) {
        List<RiskIndicatorDTO> risks = new ArrayList<>();
        List<Long> deleteAuditIds = auditLogs.stream()
                .filter(log -> log.getAction() == AuditAction.DELETE)
                .map(AuditLog::getAuditId)
                .toList();

        if (deleteAuditIds.size() > 50) {
            risks.add(RiskIndicatorDTO.builder()
                    .riskLevel(RiskLevel.HIGH)
                    .description("Unusual number of delete operations detected")
                    .affectedAuditIds(deleteAuditIds)
                    .detectedAt(LocalDateTime.now())
                    .build());
        }

        List<Long> failedAuditIds = auditLogs.stream()
                .filter(this::isFailure)
                .map(AuditLog::getAuditId)
                .toList();
        if (failedAuditIds.size() > 20) {
            risks.add(RiskIndicatorDTO.builder()
                    .riskLevel(RiskLevel.MEDIUM)
                    .description("Multiple failed audit events detected")
                    .affectedAuditIds(failedAuditIds)
                    .detectedAt(LocalDateTime.now())
                    .build());
        }
        return risks;
    }

    private boolean isFailure(AuditLog log) {
        return log.getStatus() == AuditStatus.FAILURE || log.getStatus() == AuditStatus.FAILED;
    }

    private UserActivityDTO toUserActivityDTO(AuditLog log) {
        return UserActivityDTO.builder()
                .auditId(log.getAuditId())
                .changedAt(log.getChangedAt())
                .action(log.getAction().name())
                .tableName(log.getTableName())
                .recordId(log.getRecordId())
                .summary(log.getAction().name() + " on " + log.getTableName() + " #" + log.getRecordId())
                .status(log.getStatus().name())
                .build();
    }

    private String csvValue(Object value) {
        String text = value == null ? "" : String.valueOf(value);
        return "\"" + text.replace("\"", "\"\"") + "\"";
    }
}
