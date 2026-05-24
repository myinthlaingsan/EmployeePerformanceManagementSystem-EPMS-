package ace.org.epms_backend.dto.continuous;

import ace.org.epms_backend.enums.ContinuousStatus;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class OneOnOneMeetingResponse {
    private Long meetingId;
    private Long employeeId;
    private String employeeName;
    private Long managerId;
    private String managerName;
    private String managerPositionName;
    private String meetingTitle;
    private LocalDate meetingDate;
    private LocalTime meetingTime;
    private String discussionPoints;
    private String keyIssues;
    private java.util.List<MeetingActionItemResponse> actionItems;
    private LocalDate followUpDate;

    private ContinuousStatus status;
    private Long createdBy;
    private Integer commentCount;
    private Instant createdAt;
    private java.time.LocalDateTime publishedAt;
}
