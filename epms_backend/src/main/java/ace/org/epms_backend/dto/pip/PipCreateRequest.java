package ace.org.epms_backend.dto.pip;

import ace.org.epms_backend.enums.PipSeverity;
import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

@Data
public class PipCreateRequest {

   @NotNull(message = "Employee ID is required")
    private Long employeeId;

    @NotNull(message = "Manager ID is required")
    private Long managerId;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotNull(message = "Severity is required")
    private PipSeverity severity;

    @NotBlank(message = "Reason is required")
    private String reason;

    private List<LocalDate> scheduledReviewDates;
}
