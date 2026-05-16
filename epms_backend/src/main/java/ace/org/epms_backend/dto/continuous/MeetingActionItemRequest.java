package ace.org.epms_backend.dto.continuous;

import ace.org.epms_backend.enums.ActionItemStatus;
import lombok.Data;

@Data
public class MeetingActionItemRequest {
    private String content;
    private ActionItemStatus status;
}
