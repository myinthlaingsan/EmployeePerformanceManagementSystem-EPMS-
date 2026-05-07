package ace.org.epms_backend.service.kpi;

import ace.org.epms_backend.dto.appraisal.AppraisalCycleResponse;
import ace.org.epms_backend.dto.kpi.*;
import java.util.List;

public interface KpiGoalService {
    AppraisalCycleResponse getActiveCycle();
    
    GoalSetResponse assignKpiToEmployee(GoalAssignmentRequest request);
    void bulkAssignKpi(BulkGoalAssignmentRequest request);
    
    GoalSetResponse addGoalItem(Long goalSetId, KpiGoalItemRequest request);
    GoalSetResponse updateGoalItem(Long itemId, KpiGoalItemRequest request);
    GoalSetResponse deleteGoalItem(Long itemId);
    GoalSetResponse bulkUpdateGoalItems(Long goalSetId, KpiGoalBulkUpdateRequest request);
    
    GoalSetResponse approveGoalSet(Long goalSetId);
    GoalSetResponse revertToDraft(Long goalSetId);
    GoalSetResponse lockGoalSet(Long goalSetId);
    GoalSetResponse reviseKpi(Long goalItemId, KpiRevisionRequest request);
    
    GoalSetResponse getGoalSetByEmployee(Long employeeId, Long cycleId);
    GoalSetResponse getGoalSetById(Long id);
    List<GoalSetResponse> getEmployeeGoalSets(Long employeeId);
    List<GoalSetResponse> getTeamGoalSets(Long managerId, Long cycleId);
    List<GoalSetResponse> getDepartmentGoalSets(Long departmentId, Long cycleId);
}
