package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiAchievementReportDTO {
    private Long employeeId;
    private String employeeName;
    private String departmentName;
    private String cycleName;
    private BigDecimal totalWeightedScore;
    private List<KpiItemDetailDTO> kpiItems;
}