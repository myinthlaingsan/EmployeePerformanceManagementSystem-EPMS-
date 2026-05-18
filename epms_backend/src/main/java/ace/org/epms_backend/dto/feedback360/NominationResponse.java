package ace.org.epms_backend.dto.feedback360;

import ace.org.epms_backend.enums.FeedbackRelationship;
import ace.org.epms_backend.enums.NominationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NominationResponse {
    private Long id;
    private Long targetUserId;
    private String targetUserName;
    private Long nomineeId;
    private String nomineeName;
    private FeedbackRelationship relationship;
    private NominationStatus status;
    private Long nominatedById;
    private Long approvedById;
}
