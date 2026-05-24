package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeePerformanceSummaryDTO {
    private String employeeCode;
    private String employeeName;
    private String departmentName;
    private String positionName;
    private String cycleName;
    
    // Scores
    private BigDecimal kpiScore;
    private BigDecimal selfScore;
    private BigDecimal managerScore;
    private BigDecimal feedbackScore;
    private BigDecimal finalScore;
    
    // Rating & Comments
    private String finalRating;
    private String managerComments;
    private String hrComments;
    private String selfComments;
}
