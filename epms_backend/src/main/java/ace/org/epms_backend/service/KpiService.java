package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.appraisal.AppraisalCycleResponse;
import ace.org.epms_backend.dto.kpi.*;
import java.util.List;

public interface KpiService {
    // Appraisal Cycle
    AppraisalCycleResponse getActiveCycle();

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

    // Goal Set Retrieval
    GoalSetResponse getGoalSetByEmployee(Long employeeId, Long cycleId);

    GoalSetResponse getGoalSetById(Long id);

    List<KpiProgressResponse> getRecentProgress(Long employeeId, int limit);
}
