package ace.org.epms_backend.dto.feedback360;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ScoringPolicyRequest {
    private Long cycleId;
    private Long jobLevelId;          // null = cycle-wide default
    private BigDecimal managerWeight;
    private BigDecimal peerWeight;
    private BigDecimal subordinateWeight;
    private BigDecimal selfWeight;
    private Boolean includeSelfInFinal;
    private Integer suppressionThreshold;
}
