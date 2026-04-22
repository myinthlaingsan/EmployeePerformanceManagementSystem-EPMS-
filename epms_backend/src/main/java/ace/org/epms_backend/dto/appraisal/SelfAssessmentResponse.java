package ace.org.epms_backend.dto.appraisal;

import lombok.Data;

@Data
public class SelfAssessmentResponse {

    private Long id;
    private Long appraisalId;
    private String status;
}
