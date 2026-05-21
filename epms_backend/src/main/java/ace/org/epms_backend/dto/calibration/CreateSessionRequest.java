package ace.org.epms_backend.dto.calibration;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;

@Data
public class CreateSessionRequest {

    @NotNull(message = "Cycle ID is required")
    private Long cycleId;

    private Long departmentId;

    @NotBlank(message = "Session name is required")
    private String name;

    private String facilitator;
    private Instant scheduledAt;
    private String notes;
}
