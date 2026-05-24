package ace.org.epms_backend.service.kpi;

import ace.org.epms_backend.dto.kpi.GoalSetResponse;
import ace.org.epms_backend.dto.kpi.KpiProgressResponse;
import ace.org.epms_backend.dto.kpi.ProgressRequest;
import java.util.List;

public interface KpiProgressService {
    GoalSetResponse updateProgress(ProgressRequest request);
    List<KpiProgressResponse> getRecentProgress(Long employeeId, int limit);
}
