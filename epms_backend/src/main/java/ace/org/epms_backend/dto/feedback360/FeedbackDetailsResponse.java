package ace.org.epms_backend.dto.feedback360;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class FeedbackDetailsResponse {
    private Long feedbackId;
    private Long requestId;
    private String relationship;        // SELF, DIRECT_MANAGER, PEER, SUBORDINATE
    private String evaluatorName;       // real name or "Anonymous"
    private String submittedAt;         // ISO timestamp
    private String overallComment;
    private BigDecimal averageScore;
    private List<FeedbackResponseDetails> responses;
}
