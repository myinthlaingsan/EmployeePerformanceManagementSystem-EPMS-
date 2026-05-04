package ace.org.epms_backend.dto.kpi;

import ace.org.epms_backend.enums.KpiGoalStatus;
import lombok.Data;
import java.util.List;

@Data
public class GoalSetResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private Long managerId;
    private String managerName;
    private Long appraisalCycleId;
    private String appraisalCycleName;
    private KpiGoalStatus status;
    private List<GoalItemResponse> items;
}
