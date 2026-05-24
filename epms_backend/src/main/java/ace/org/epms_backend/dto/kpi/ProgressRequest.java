package ace.org.epms_backend.dto.kpi;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProgressRequest {
    @NotNull(message = "Goal Item ID is required")
    private Long goalItemId;

    @NotNull(message = "Actual value is required")
    @DecimalMin(value = "0", message = "Actual value cannot be negative")
    private BigDecimal actualValue;

    @NotNull(message = "Progress percent is required")
    @DecimalMin(value = "0", message = "Progress percent cannot be negative")
    @DecimalMax(value = "100", message = "Progress percent cannot exceed 100")
    private BigDecimal progressPercent;

    private String evidenceNote;
}
