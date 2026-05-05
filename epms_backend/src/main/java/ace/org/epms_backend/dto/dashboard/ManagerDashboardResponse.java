package ace.org.epms_backend.dto.dashboard;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class ManagerDashboardResponse {
    private Integer appraisalsToEvaluate;
    private Integer completedEvaluations;
    private List<TeamAppraisalSummary> teamAppraisals;

    @Data
    @Builder
    public static class TeamAppraisalSummary {
        private Long appraisalId;
        private String staffName;
        private String employeeCode;
        private String status;
    }
}
