package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.kpi.*;
import java.util.List;

public interface KpiService {
    // KPI Library
    KpiLibraryResponse createLibrary(KpiLibraryRequest request);

    List<KpiLibraryResponse> getAllActiveLibraries();

    KpiLibraryResponse toggleLibraryStatus(Long id, boolean status);

    List<KpiCategoryResponse> getAllCategories();

    // KPI Assignment
    GoalSetResponse assignKpiToEmployee(GoalAssignmentRequest request);

    // Goal Management
    GoalSetResponse addGoalItem(Long goalSetId, KpiGoalItemRequest request);

    GoalSetResponse updateGoalItem(Long itemId, KpiGoalItemRequest request);

    GoalSetResponse deleteGoalItem(Long itemId);

    GoalSetResponse approveGoalSet(Long goalSetId);

    // Progress
    GoalSetResponse updateProgress(ProgressRequest request);

    // Revision
    GoalSetResponse reviseKpi(Long goalItemId, KpiRevisionRequest request);

    // Scoring
    KpiScoreResponse calculateFinalScore(Long employeeId, Long cycleId);
}
