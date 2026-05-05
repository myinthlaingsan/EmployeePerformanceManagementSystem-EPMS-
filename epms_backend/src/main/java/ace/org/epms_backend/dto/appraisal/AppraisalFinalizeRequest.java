package ace.org.epms_backend.dto.appraisal;

import lombok.Data;

@Data
public class AppraisalFinalizeRequest {

    private Long appraisalId;
    private String managerComment;
    private String hrComment;
}
