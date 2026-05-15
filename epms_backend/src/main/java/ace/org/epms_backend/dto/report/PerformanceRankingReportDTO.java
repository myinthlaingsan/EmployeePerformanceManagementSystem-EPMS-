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
public class PerformanceRankingReportDTO {
    private Integer rank;
    private String employeeName;
    private String departmentName;
    private BigDecimal currentScore;
    private BigDecimal previousScore;
    private String rating;
    private String trend; // e.g., "UP", "DOWN", "STABLE"
    private Boolean isHighPerformer;
}
