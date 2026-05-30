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
public class KpiSummaryReportDTO {
    private String employeeName;
    private String departmentName;
    private String positionName;
    private String generatedDate;
    private BigDecimal averageScore;
    private String overallCategory;
    private List<CycleSummaryDTO> cycles;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CycleSummaryDTO {
        private String cycleName;
        private String cycleStartDate;   // dd-MM-yyyy
        private String cycleEndDate;
        private BigDecimal kpiScore;
        private String performanceCategory;
        private int totalItems;
        private int achievedItems;
    }
}
