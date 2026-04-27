package ace.org.epms_backend.dto.appraisal;

import ace.org.epms_backend.enums.AppraisalStatus;
import lombok.Data;

@Data
public class AppraisalUpdateRequest {
    private Long employeeId;
    private Long cycleId;
    private Long managerId;
    private AppraisalStatus status;
}
