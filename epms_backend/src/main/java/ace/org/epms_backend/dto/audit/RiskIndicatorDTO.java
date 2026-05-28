package ace.org.epms_backend.dto.audit;

import ace.org.epms_backend.enums.RiskLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskIndicatorDTO {
    private RiskLevel riskLevel;
    private String description;
    private List<Long> affectedAuditIds;
    private LocalDateTime detectedAt;
}
