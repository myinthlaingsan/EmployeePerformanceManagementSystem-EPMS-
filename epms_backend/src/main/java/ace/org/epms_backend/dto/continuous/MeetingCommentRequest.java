package ace.org.epms_backend.dto.continuous;

import ace.org.epms_backend.enums.CommentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MeetingCommentRequest {
    private Long employeeId;
    private Long managerId;

    @NotBlank(message = "Comment is required")
    private String comment;

    @NotNull(message = "Comment type is required")
    private CommentType commentType;
}
