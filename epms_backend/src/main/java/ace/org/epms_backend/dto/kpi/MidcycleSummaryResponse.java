package ace.org.epms_backend.dto.kpi;

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
public class MidcycleSummaryResponse {
    private Long employeeId;
    private String employeeName;
    private Long cycleId;
    private String cycleName;
    private int totalCycleDays;
    private boolean hasOpenPhase;
    private List<MidcyclePhaseResponse> phases;
    private BigDecimal compositeScore;
}
