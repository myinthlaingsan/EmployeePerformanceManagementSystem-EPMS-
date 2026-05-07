package ace.org.epms_backend.dto.continuous;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FeedbackReplyRequest {
    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    @NotBlank(message = "Reply text cannot be blank")
    private String replyText;

    private Long parentId;
}
