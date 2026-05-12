package ace.org.epms_backend.service.kpi;

import ace.org.epms_backend.dto.kpi.KpiScoreResponse;

public interface KpiScoringService {
    KpiScoreResponse calculateFinalScore(Long employeeId, Long cycleId);
}
