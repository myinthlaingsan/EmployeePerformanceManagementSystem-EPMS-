package ace.org.epms_backend.dto.kpi;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MidcycleChangeRequest {
    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    @NotNull(message = "Appraisal Cycle ID is required")
    private Long cycleId;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    @NotNull(message = "Change date is required")
    private LocalDateTime changeDate;

    @NotBlank(message = "Change reason is required")
    private String changeReason;
}
