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
public class DepartmentAnalyticsDTO {
    private Long departmentId;
    private String departmentName;
    private BigDecimal avgScore;
    private double completionRate;
    private int pipCount;
    private int employeeCount;
    private int rank;
}
