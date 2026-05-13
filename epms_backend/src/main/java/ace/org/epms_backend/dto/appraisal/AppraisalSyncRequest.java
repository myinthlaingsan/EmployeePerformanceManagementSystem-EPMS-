package ace.org.epms_backend.dto.appraisal;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class AppraisalSyncRequest {
    @NotNull(message = "Cycle ID is required")
    private Long cycleId;
}

