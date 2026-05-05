package ace.org.epms_backend.dto.dashboard;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class AdminDashboardResponse {
    private Long totalEmployees;
    private Long activeCycles;
    private Long totalAppraisals;
    private Map<String, Long> statusCounts;
    private Double overallAverageScore;
}
