package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TeamPerformanceBreakdownFlatDTO {
    private String departmentName;
    private Double departmentAverage;
    private String teamName;
    private Double teamAverage;
    private String employeeName;
    private String role;
    private Double averageScore;
}
