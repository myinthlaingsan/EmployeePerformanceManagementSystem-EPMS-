package ace.org.epms_backend.dto.appraisal;

import lombok.Data;

@Data
public class AppraisalCreateRequest {
    private Long employeeId;
    private Long cycleId;
}
