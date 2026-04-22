package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.kpi.*;
import java.util.List;

public interface KpiService {
    // KPI Library
    KpiLibraryResponse createLibrary(KpiLibraryRequest request);

    List<KpiLibraryResponse> getAllActiveLibraries();

    void toggleLibraryStatus(Long id, boolean status);

    // KPI Assignment
    GoalSetResponse assignKpiToEmployee(GoalAssignmentRequest request);

    // Goal Management
    void approveGoalSet(Long goalSetId);

    // Progress
    void updateProgress(ProgressRequest request);

    // Revision
    void reviseKpi(Long goalItemId, KpiRevisionRequest request);

    // Scoring
    void calculateFinalScore(Long employeeId, Long cycleId);
}
