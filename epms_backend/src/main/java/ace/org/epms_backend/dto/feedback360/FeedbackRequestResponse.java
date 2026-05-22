package ace.org.epms_backend.dto.feedback360;

import ace.org.epms_backend.enums.FeedbackRelationship;
import ace.org.epms_backend.enums.FeedbackStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackRequestResponse {
    private Long id;
    private Long targetUserId;
    private String targetUserName;
    private Long evaluatorId;
    private String evaluatorName;
    private Long cycleId;
    private FeedbackRelationship relationship;
    private FeedbackStatus status;
    private String targetDepartmentName;
    private String evaluatorDepartmentName;
    private Boolean isAnonymous;

    private Boolean isReciprocalFallback;
}
