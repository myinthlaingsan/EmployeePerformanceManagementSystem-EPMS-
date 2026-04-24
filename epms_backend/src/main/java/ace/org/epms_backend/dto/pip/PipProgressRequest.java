package ace.org.epms_backend.dto.pip;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PipProgressRequest {

    private Long objectiveId;

    private String progressNote;

    @Min(value = 0, message = "Progress percentage must be at least 0")
    @Max(value = 100, message = "Progress percentage cannot exceed 100")
    private BigDecimal progressPercent;
}