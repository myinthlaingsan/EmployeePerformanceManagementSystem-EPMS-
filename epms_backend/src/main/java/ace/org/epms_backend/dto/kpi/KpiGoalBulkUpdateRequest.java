package ace.org.epms_backend.dto.kpi;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class KpiGoalBulkUpdateRequest {
    private List<ItemUpdate> items;

    @Data
    public static class ItemUpdate {
        private Long id; // Optional for new items, but usually we just update existing
        private String title;
        private String unit;
        private BigDecimal targetValue;
        private BigDecimal weightPercent;
        private Long categoryId;
    }
}
