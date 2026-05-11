package ace.org.epms_backend.dto.pip;

import ace.org.epms_backend.enums.PipSeverity;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class PipCreateRequest {

    private Long employeeId;
    private Long managerId;

    private LocalDate startDate;
    private LocalDate endDate;

    private PipSeverity severity;
    private String reason;
    
    private List<LocalDate> scheduledReviewDates;
}