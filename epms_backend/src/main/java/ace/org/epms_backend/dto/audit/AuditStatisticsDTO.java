package ace.org.epms_backend.dto.audit;

import ace.org.epms_backend.enums.AuditAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditStatisticsDTO {
    private Long totalAuditEntries;
    private Map<AuditAction, Long> actionDistribution;
    private Map<String, Long> tableModificationCounts;
    private Map<String, Long> userActivityCounts;
    private Double averageChangesPerDay;
    private RiskMetricsDTO riskMetrics;
}
