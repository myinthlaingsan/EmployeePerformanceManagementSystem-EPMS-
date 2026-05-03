package ace.org.epms_backend.dto.kpi;

import lombok.Data;

import java.util.List;

@Data
public class KpiLibraryResponse {
    private Long id;
    private String title;
    private String description;
    private String positionName;
    private Long positionId;
    private Long targetLevelId;
    private Boolean isActive;
    private List<KpiLibraryDetailResponse> details;
}
