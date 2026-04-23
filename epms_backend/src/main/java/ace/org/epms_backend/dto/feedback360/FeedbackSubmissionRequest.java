package ace.org.epms_backend.dto.feedback360;

import lombok.*;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackSubmissionRequest {
    private Long requestId;
    private String overallComment;
    private List<FeedbackAnswerRequest> answers;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FeedbackAnswerRequest {
        private Long questionId;
        private Integer score;
        private String comment;
    }
}
