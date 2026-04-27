package ace.org.epms_backend.dto.continuous;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class OneOnOneMeetingRequest {
    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    @NotNull(message = "Manager ID is required")
    private Long managerId;

    @NotNull(message = "Meeting date is required")
    private LocalDate meetingDate;

    @NotNull(message = "Meeting time is required")
    private LocalTime meetingTime;

    private String discussionPoints;
    private String keyIssues;
    private String actionItems;
    private LocalDate followUpDate;
    private Boolean isPrivateNote = false;
}
