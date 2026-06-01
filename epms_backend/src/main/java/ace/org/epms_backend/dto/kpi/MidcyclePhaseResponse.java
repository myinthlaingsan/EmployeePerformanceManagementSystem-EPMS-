package ace.org.epms_backend.dto.kpi;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MidcyclePhaseResponse {
    private int phaseNumber;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer days;
    private BigDecimal weight;
    private BigDecimal score;
    private BigDecimal weightedContribution;
    private Long goalSetId;
    private String status;
    private String changeReason;
}
