package ace.org.epms_backend.dto.continuous;

import lombok.Data;
import java.time.Instant;

@Data
public class FeedbackReplyResponse {
    private Long replyId;
    private Long feedbackId;
    private Long employeeId;
    private String employeeName;
    private String replyText;
    private Long parentId;
    private Instant createdAt;
}
