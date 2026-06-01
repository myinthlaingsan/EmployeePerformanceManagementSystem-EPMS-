package ace.org.epms_backend.dto.audit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskMetricsDTO {
    private Double failureRate;
    private Long bulkOperationCount;
    private Long unusualAccessPatterns;
}
