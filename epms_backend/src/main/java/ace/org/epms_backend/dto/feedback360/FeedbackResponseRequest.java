package ace.org.epms_backend.dto.feedback360;

import lombok.Data;

@Data
public class FeedbackResponseRequest {
    private Long questionId;
    private Integer score;
    private String comment;
}
