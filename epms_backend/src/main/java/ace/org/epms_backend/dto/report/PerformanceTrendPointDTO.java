package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceTrendPointDTO {
    private String period;
    private BigDecimal avgScore;
    private double completionRate;
    private double pipResolutionRate;
    private BigDecimal engagementScore;
}
