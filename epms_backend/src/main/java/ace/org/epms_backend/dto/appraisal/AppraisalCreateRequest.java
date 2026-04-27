package ace.org.epms_backend.dto.appraisal;

import lombok.Data;

@Data
public class AppraisalCreateRequest {
    private Long employeeId;
    private Long managerId;
    private Long cycleId;
    private Long formId;
    private Long performanceCategoryId;
}
