package ace.org.epms_backend.dto.feedback360;

import ace.org.epms_backend.enums.FeedbackRelationship;
import ace.org.epms_backend.enums.FeedbackStatus;
import lombok.Data;

@Data
public class FeedbackRequestResponse {
    private Long id;
    private Long targetUserId;
    private String targetUserName;
    private Long evaluatorId;
    private String evaluatorName;
    private Long cycleId;
    private FeedbackRelationship relationship;
    private FeedbackStatus status;
    private Boolean isAnonymous;
}
