package ace.org.epms_backend.dto.kpi;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrgKpiHistoryResponse {
    private OrgKpiHistorySummary summary;
    private List<KpiAuditLogResponse> logs;
    private int page;
    private int size;
    private long totalElements;
}
