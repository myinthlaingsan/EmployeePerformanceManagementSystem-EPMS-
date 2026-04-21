package ace.org.epms_backend.dto.appraisal;

import lombok.Data;

@Data
public class AppraisalAssignRequest {
    private Long appraisalId;
    private Long managerId;
}
