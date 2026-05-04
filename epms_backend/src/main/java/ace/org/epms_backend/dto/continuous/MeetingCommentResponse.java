package ace.org.epms_backend.dto.continuous;

import ace.org.epms_backend.enums.CommentType;
import lombok.Data;

import java.time.Instant;

@Data
public class MeetingCommentResponse {
    private Long id;
    private Long meetingId;
    private Long employeeId;
    private String employeeName;
    private Long managerId;
    private String managerName;
    private String comment;
    private CommentType commentType;
    private Long parentId;
    private Instant createdAt;
}
