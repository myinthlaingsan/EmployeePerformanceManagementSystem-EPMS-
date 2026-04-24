package ace.org.epms_backend.dto.kpi;

import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;

@Data
public class KpiScoreResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private Long cycleId;
    private BigDecimal weightedScore;
    private Instant calculatedAt;
}
