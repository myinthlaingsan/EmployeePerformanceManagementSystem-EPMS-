package ace.org.epms_backend.dto.kpi;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class MidcycleChangeRequest {
    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    @NotNull(message = "Appraisal Cycle ID is required")
    private Long cycleId;

    @NotNull(message = "Change date is required")
    private LocalDate changeDate;

    @NotBlank(message = "Change reason is required")
    private String changeReason;
}
