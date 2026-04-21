package ace.org.epms_backend.dto.kpi;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class KpiLibraryResponse {
    private Long id;
    private String title;
    private String description;
    private String positionName;
    private Boolean isActive;
    private List<KpiLibraryDetailResponse> details;
}
