package ace.org.epms_backend.service.kpi;

import ace.org.epms_backend.dto.kpi.MidcycleChangeRequest;
import ace.org.epms_backend.dto.kpi.MidcycleSummaryResponse;

public interface KpiMidcycleService {
    void triggerMidcycleChange(MidcycleChangeRequest request);
    void calculateCompositeFinalScore(Long employeeId, Long cycleId);
    MidcycleSummaryResponse getMidcycleSummary(Long employeeId, Long cycleId);
    void linkGoalSetToOpenPhase(Long employeeId, Long cycleId, Long goalSetId);
    
}
