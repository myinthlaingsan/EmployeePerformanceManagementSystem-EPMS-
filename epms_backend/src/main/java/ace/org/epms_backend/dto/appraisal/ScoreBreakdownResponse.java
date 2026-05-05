package ace.org.epms_backend.dto.appraisal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreBreakdownResponse {
    private Long appraisalId;
    
    // Raw Scores
    private BigDecimal kpiRawScore;
    private BigDecimal managerRawScore;
    private BigDecimal selfRawScore;
    private BigDecimal feedbackRawScore;
    
    // Applied Weights
    private BigDecimal kpiWeight;
    private BigDecimal managerWeight;
    private BigDecimal selfWeight;
    private BigDecimal feedbackWeight;
    
    // Calculated Weighted Scores
    private BigDecimal kpiWeightedScore;
    private BigDecimal managerWeightedScore;
    private BigDecimal selfWeightedScore;
    private BigDecimal feedbackWeightedScore;
    
    // Final Result
    private BigDecimal finalTotalScore;
    private ace.org.epms_backend.enums.PerformanceGrade finalGrade;
}

