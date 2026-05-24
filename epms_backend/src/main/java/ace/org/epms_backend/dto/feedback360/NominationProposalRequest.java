package ace.org.epms_backend.dto.feedback360;

import ace.org.epms_backend.enums.FeedbackRelationship;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class NominationProposalRequest {

    @NotNull
    private Long targetUserId;

    @NotNull
    private Long nomineeId;

    @NotNull
    private FeedbackRelationship relationship;
}
