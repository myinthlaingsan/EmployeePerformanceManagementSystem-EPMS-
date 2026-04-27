package ace.org.epms_backend.dto.appraisal;

import lombok.Data;

@Data
public class AppraisalResponse {

    private Long appraisalId;
    private Long employeeId;
    private Long managerId;
    private String status;
    private Double totalScore;
    private String categoryName;
}
