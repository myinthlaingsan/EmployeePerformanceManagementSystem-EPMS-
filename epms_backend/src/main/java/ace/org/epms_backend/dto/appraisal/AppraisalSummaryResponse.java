package ace.org.epms_backend.dto.appraisal;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class AppraisalSummaryResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private Long cycleId;
    private BigDecimal totalScore;
    private String finalGrade;
}
