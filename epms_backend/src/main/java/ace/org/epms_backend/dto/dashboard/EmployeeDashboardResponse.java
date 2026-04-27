package ace.org.epms_backend.dto.dashboard;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class EmployeeDashboardResponse {
    private Integer pendingAppraisals;
    private Integer completedAppraisals;
    private List<AppraisalSummary> activeAppraisals;

    @Data
    @Builder
    public static class AppraisalSummary {
        private Long appraisalId;
        private String cycleName;
        private String status;
    }
}
