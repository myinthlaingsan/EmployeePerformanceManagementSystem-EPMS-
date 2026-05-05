package ace.org.epms_backend.dto.appraisal;

import ace.org.epms_backend.enums.PerformanceGrade;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppraisalSummaryResponse {
    private Long appraisalId;
    private Long employeeId;
    private String employeeName;
    private Long cycleId;
    private String cycleName;
    private BigDecimal finalScore;
    private PerformanceGrade finalGrade;
}


