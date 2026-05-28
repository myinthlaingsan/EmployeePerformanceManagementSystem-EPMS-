package ace.org.epms_backend.dto.audit;

import ace.org.epms_backend.enums.ReportType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogReportDTO {
    private LocalDate reportDate;
    private LocalDateRange dateRange;
    private ReportType reportType;
    private AuditSummaryDTO summary;
    private List<AuditChangeDTO> details;
    private List<RiskIndicatorDTO> riskIndicators;
    private String generatedBy;
    private Instant generatedAt;
}
