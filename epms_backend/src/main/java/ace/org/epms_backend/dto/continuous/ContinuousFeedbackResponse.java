package ace.org.epms_backend.dto.continuous;

import ace.org.epms_backend.enums.FeedbackType;
import lombok.Data;
import java.time.Instant;

@Data
public class ContinuousFeedbackResponse {
    private Long feedbackId;
    private Long employeeId;
    private String employeeName;
    private Long managerId;
    private String managerName;
    private FeedbackType feedbackType;
    private FeedbackTagResponse tag;
    private String description;
    private Boolean isPrivate;
    private Long createdBy;
    private Instant createdAt;
}
