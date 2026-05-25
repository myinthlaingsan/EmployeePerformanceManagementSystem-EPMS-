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
public class PerformancePotentialMatrixDTO {
    private Long employeeId;
    private String employeeName;
    private String departmentName;
    private BigDecimal performanceScore;
    private BigDecimal potentialScore;
    private String quadrant;
}
