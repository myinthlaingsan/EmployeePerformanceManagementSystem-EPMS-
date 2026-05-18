package ace.org.epms_backend.dto.appraisal;

import ace.org.epms_backend.enums.CycleStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppraisalCycleResponse {
    private Long cycleId;
    private String cycleName;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate selfAssessmentDeadline;
    private LocalDate managerEvaluationDeadline;
    private LocalDate finalizationDeadline;
    private String evaluationPeriod;
    private CycleStatus status;
    private Boolean isActive;
    
    // Scoring Weights
    private BigDecimal kpiWeight;
    private BigDecimal managerWeight;
    private BigDecimal feedbackWeight;
    private BigDecimal selfWeight;
    
    private Instant createdAt;
    private Instant updatedAt;
    
    private Long financialYearId;
    private String financialYearTitle;
    private Boolean isAssigned;
}

