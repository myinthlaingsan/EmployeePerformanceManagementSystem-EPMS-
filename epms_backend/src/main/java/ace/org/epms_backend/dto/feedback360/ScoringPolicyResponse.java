package ace.org.epms_backend.dto.feedback360;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoringPolicyResponse {
    private Long id;
    private Long cycleId;
    private Long jobLevelId;
    private String jobLevelCode;
    private BigDecimal managerWeight;
    private BigDecimal peerWeight;
    private BigDecimal subordinateWeight;
    private BigDecimal selfWeight;
    private Boolean includeSelfInFinal;
    private Integer suppressionThreshold;
}
