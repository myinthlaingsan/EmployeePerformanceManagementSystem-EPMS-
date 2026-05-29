package ace.org.epms_backend.service.kpi;

import ace.org.epms_backend.dto.kpi.KpiAuditLogResponse;
import ace.org.epms_backend.dto.kpi.OrgKpiHistoryResponse;
import java.util.List;

public interface KpiAuditLogService {

    // HR: org-wide log
    OrgKpiHistoryResponse getOrgWideHistory(Long cycleId, String action, int page, int size);

    // Manager: team-scoped log
    OrgKpiHistoryResponse getTeamHistory(Long cycleId, String action, int page, int size);

    // HR + Manager + Employee: enriched individual history for one employee + cycle
    List<KpiAuditLogResponse> getIndividualHistory(Long employeeId, Long cycleId);
}
