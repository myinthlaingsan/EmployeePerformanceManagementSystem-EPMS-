package ace.org.epms_backend.dto.continuous;

import ace.org.epms_backend.enums.FeedbackType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ContinuousFeedbackRequest {
    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    @NotNull(message = "Manager ID is required")
    private Long managerId;

    @NotNull(message = "Feedback Type is required")
    private FeedbackType feedbackType;

    private Long tagId;

    @NotBlank(message = "Description cannot be blank")
    private String description;

    private Boolean isPrivate = false;
}
