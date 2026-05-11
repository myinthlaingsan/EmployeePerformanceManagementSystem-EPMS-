package ace.org.epms_backend.dto.kpi;

import ace.org.epms_backend.enums.KpiItemStatus;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class GoalItemResponse {
    private Long id;
    private String title;
    private BigDecimal targetValue;
    private String unit;
    private BigDecimal weightPercent;
    private KpiItemStatus status;
    private BigDecimal currentProgress;
    private BigDecimal scorePercent;
    private BigDecimal weightedScore;
    private String categoryName;
    private Long categoryId;
}
