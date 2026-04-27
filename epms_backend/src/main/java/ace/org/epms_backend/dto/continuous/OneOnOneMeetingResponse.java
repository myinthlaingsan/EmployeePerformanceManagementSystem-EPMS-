package ace.org.epms_backend.dto.continuous;

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
    private LocalDate meetingDate;
    private LocalTime meetingTime;
    private String discussionPoints;
    private String keyIssues;
    private String actionItems;
    private LocalDate followUpDate;
    private Boolean isPrivateNote;
    private Long createdBy;
    private Instant createdAt;
}
