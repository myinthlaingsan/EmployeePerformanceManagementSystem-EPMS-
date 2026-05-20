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
public class Feedback360ManagerPackItemDTO {
    private String targetEmployeeName;
    private String targetEmployeeCode;
    private String targetDepartmentName;
    private String targetPositionName;
    private BigDecimal selfScore;
    private BigDecimal managerScore;
    private BigDecimal peerScore;
    private BigDecimal subordinateScore;
    private BigDecimal finalScore;
    private BigDecimal calibratedFinalScore;
    private String managerSummary;
}
