package ace.org.epms_backend.dto.feedback360;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CompetencyRequest {

    @NotBlank(message = "Competency name is required")
    private String name;

    private String description;
}
