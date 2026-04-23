package ace.org.epms_backend.dto.feedback360;

import ace.org.epms_backend.enums.FeedbackRelationship;
import ace.org.epms_backend.enums.FeedbackStatus;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackRequestResponse {
    private Long id;
    private String targetUserName;
    private String cycleName;
    private FeedbackRelationship relationship;
    private FeedbackStatus status;
    private Boolean isAnonymous;
}
