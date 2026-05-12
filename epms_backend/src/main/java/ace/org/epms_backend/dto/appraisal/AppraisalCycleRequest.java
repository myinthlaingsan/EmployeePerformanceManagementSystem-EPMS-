package ace.org.epms_backend.dto.appraisal;

import ace.org.epms_backend.enums.CycleStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppraisalCycleRequest {
    @NotBlank(message = "Cycle name is required")
    private String cycleName;
    
    @NotNull(message = "Start date is required")
    private LocalDate startDate;
    
    @NotNull(message = "End date is required")
    private LocalDate endDate;
    
    @NotNull(message = "Self assessment deadline is required")
    private LocalDate selfAssessmentDeadline;
    
    @NotNull(message = "Manager evaluation deadline is required")
    private LocalDate managerEvaluationDeadline;
    
    @NotNull(message = "Finalization deadline is required")
    private LocalDate finalizationDeadline;
    
    private String evaluationPeriod;
    private CycleStatus status;
    private Boolean isActive;
    
    // Scoring Weights
    private BigDecimal kpiWeight;
    private BigDecimal managerWeight;
    private BigDecimal feedbackWeight;
    private BigDecimal selfWeight;
    
    @NotNull(message = "Financial year ID is required")
    private Long financialYearId;
}


