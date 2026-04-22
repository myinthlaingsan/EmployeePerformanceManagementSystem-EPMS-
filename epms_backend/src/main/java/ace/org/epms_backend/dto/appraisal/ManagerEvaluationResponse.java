package ace.org.epms_backend.dto.appraisal;

import lombok.Data;

@Data
public class ManagerEvaluationResponse {

    private Long id;
    private Long appraisalId;
    private String status;
}
