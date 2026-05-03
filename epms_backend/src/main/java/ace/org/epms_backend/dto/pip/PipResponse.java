package ace.org.epms_backend.dto.pip;

import ace.org.epms_backend.enums.PipOutcome;
import ace.org.epms_backend.enums.PipSeverity;
import ace.org.epms_backend.enums.PipStatus;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class PipResponse {

    private Long pipId;

    private Long employeeId;
    private Long managerId;

    private LocalDate startDate;
    private LocalDate endDate;

    private PipStatus status;
    private PipOutcome finalOutcome;

    private PipSeverity severity;
    private String reason;
    private String managerPrivateNote;
    private String employeePrivateNote;
    
    private List<LocalDate> scheduledReviewDates;
}