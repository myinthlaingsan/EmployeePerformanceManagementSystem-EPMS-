package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceDistributionReportDTO {
    private List<PerformanceDistributionBinDTO> bins;
    private BigDecimal mean;
    private BigDecimal median;
    private BigDecimal standardDeviation;
    private BigDecimal skewness;
    private int sampleSize;
}
