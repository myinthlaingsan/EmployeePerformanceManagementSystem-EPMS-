package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.idp.DevelopmentGoalRequest;
import ace.org.epms_backend.dto.idp.DevelopmentGoalResponse;
import ace.org.epms_backend.dto.idp.DevelopmentGoalUpdateRequest;
import ace.org.epms_backend.enums.DevelopmentGoalStatus;

import java.util.List;

public interface DevelopmentGoalService {
    DevelopmentGoalResponse createGoal(DevelopmentGoalRequest request);
    DevelopmentGoalResponse updateGoal(Long goalId, DevelopmentGoalUpdateRequest request);
    DevelopmentGoalResponse updateStatus(Long goalId, DevelopmentGoalStatus status);
    List<DevelopmentGoalResponse> getByPlan(Long idpId);
    void deleteGoal(Long goalId);
}
