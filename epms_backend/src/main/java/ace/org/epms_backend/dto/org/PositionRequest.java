package ace.org.epms_backend.dto.org;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PositionRequest {
    @NotBlank(message = "Position code is required")
    private String positionCode;

    @NotBlank(message = "Position name is required")
    private String positionName;

    @NotNull(message = "Level ID is required")
    private Long levelId;
}
