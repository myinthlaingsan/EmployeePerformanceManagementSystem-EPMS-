package ace.org.epms_backend.dto.feedback360;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FeedbackRequestDTO {
    private Long id;
    private Long targetUserId;
    private Long evaluatorId;
    private String relationship;
    private String status;
}
