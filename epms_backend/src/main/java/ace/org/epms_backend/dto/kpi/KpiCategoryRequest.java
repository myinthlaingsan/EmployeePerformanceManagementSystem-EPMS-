package ace.org.epms_backend.dto.kpi;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class KpiCategoryRequest {
    @NotBlank
    private String name;
}
