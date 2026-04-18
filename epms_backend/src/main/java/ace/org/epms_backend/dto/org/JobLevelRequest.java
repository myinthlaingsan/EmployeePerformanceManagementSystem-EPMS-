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
public class JobLevelRequest {
    @NotBlank(message = "Level code is required")
    private String levelCode;

    @NotBlank(message = "Level name is required")
    private String levelName;

    @NotNull(message = "Level rank is required")
    private Integer levelRank;
}
