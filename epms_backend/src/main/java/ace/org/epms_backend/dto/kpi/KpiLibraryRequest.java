package ace.org.epms_backend.dto.kpi;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class KpiLibraryRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Position ID is required")
    private Long positionId;

    @NotEmpty(message = "KPI details are required")
    private List<KpiLibraryDetailRequest> details;
}
