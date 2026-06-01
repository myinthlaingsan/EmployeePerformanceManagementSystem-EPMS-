package ace.org.epms_backend.dto.idp;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DevelopmentProgressRequest {
    @NotNull
    private Long goalId;
    @NotBlank
    private String progressNote;
    @NotNull
    @Min(0)
    @Max(100)
    private Integer progressPercent;
}
