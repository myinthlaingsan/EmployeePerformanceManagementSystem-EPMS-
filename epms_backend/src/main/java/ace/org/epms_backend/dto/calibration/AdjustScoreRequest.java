package ace.org.epms_backend.dto.calibration;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AdjustScoreRequest {

    @NotNull(message = "Calibrated score is required")
    @DecimalMin(value = "0.0", message = "Score must be at least 0")
    @DecimalMax(value = "100.0", message = "Score must be at most 100")
    private BigDecimal calibratedFinalScore;

    @NotBlank(message = "Calibration reason is required")
    private String calibrationReason;
}
