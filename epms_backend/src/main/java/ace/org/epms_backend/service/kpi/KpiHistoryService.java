package ace.org.epms_backend.service.kpi;

import ace.org.epms_backend.dto.kpi.GoalSetResponse;
import ace.org.epms_backend.model.kpi.KpiHistoryLog;

import java.util.List;

public interface KpiHistoryService {
    List<GoalSetResponse> getEmployeeKpiHistory(Long employeeId);
    List<KpiHistoryLog> getGoalSetAuditTrail(Long goalSetId);
}
