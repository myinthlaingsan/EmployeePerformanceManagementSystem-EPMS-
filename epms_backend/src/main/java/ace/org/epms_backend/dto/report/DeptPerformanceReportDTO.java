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
public class DeptPerformanceReportDTO {
    private String departmentName;
    private BigDecimal averageKpiScore;
    private BigDecimal averageAppraisalScore;
    private BigDecimal average360Score;
    private int employeeCount;
    private int topPerformersCount;
    private int lowPerformersCount;
    private int rank;
}
