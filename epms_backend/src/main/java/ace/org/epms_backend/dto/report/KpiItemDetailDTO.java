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
public class KpiItemDetailDTO {
    private String categoryName;
    private String title;
    private String unit;
    private BigDecimal targetValue;
    private BigDecimal actualValue;
    private BigDecimal weightPercent;
    private BigDecimal scorePercent;
    private BigDecimal weightedScore;
    private String status;
}
