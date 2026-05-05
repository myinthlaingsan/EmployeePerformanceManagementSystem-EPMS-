package ace.org.epms_backend.dto.feedback360;

import lombok.Data;

@Data
public class FeedbackResponseDetails {
    private Long questionId;
    private String questionText;
    private Integer score;
    private String comment;
}
