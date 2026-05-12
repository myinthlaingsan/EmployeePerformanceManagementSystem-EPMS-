package ace.org.epms_backend.dto.feedback360;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackDetailsResponse {
    private Long feedbackId;
    private Long requestId;
    private String overallComment;
    private BigDecimal averageScore;
    private List<FeedbackResponseDetails> responses;

    private Long targetUserId;
    private String targetUserName;
    private Long evaluatorId;
    private String evaluatorName;
    private String relationship;
    private Instant submittedAt;
}
