package ace.org.epms_backend.dto.feedback360;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class FeedbackResponseRequest {
    private Long questionId;

    @Min(1)
    @Max(5)
    private Integer score;  // nullable for comment-only questions

    private String comment;
}
