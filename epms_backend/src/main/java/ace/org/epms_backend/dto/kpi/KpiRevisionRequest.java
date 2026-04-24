package ace.org.epms_backend.dto.kpi;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class KpiRevisionRequest {
    @NotBlank(message = "Reason for change is required")
    private String changeReason;

    @NotNull(message = "Updated KPI details are required")
    private KpiLibraryDetailRequest updatedDetails;
}
