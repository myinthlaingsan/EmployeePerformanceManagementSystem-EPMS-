package ace.org.epms_backend.dto.continuous;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FeedbackTagRequest {
    @NotBlank(message = "Tag name cannot be blank")
    private String tagName;
}
