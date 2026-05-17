package ace.org.epms_backend.dto.kpi;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class KpiLibraryDetailRequest {
    @NotBlank(message = "Goal title is required")
    private String goalTitle;

    @NotNull(message = "Target value is required")
    @DecimalMin(value = "0.0", message = "Target value cannot be negative")
    private BigDecimal targetValue;

    @NotNull(message = "Weight percent is required")
    @DecimalMin(value = "0.0", message = "Weight percent cannot be negative")
    private BigDecimal weightPercent;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    @NotNull(message = "Unit is required")
    private String unit;

    private Boolean isCompliance = false;
}
