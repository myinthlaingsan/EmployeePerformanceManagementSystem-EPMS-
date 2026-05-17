package ace.org.epms_backend.dto.kpi;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class KpiGoalItemRequest {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Unit is required")
    private String unit;

    @NotNull(message = "Target value is required")
    private BigDecimal targetValue;

    @NotNull(message = "Weight percent is required")
    private BigDecimal weightPercent;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private Boolean isCompliance = false;
}
