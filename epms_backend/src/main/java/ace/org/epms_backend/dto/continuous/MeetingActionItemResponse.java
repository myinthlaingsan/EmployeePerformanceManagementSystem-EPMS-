package ace.org.epms_backend.dto.continuous;

import ace.org.epms_backend.enums.ActionItemStatus;
import lombok.Data;

@Data
public class MeetingActionItemResponse {
    private Long id;
    private String content;
    private ActionItemStatus status;
    private java.time.LocalDateTime completedAt;
    private String reopenReason;
    private Long assignedToId;
    private String assignedToName;
    private java.time.LocalDate dueDate;
}
