package ace.org.epms_backend.dto.kpi;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class KpiLibraryDetailResponse {
    private Long id;
    private String goalTitle;
    private BigDecimal targetValue;
    private BigDecimal weightPercent;
    private Boolean isActive;
    private String unit;
    private String categoryName;
    private Long categoryId;
    private Boolean isCompliance;
}
