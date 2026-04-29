package ace.org.epms_backend.dto.appraisal;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class AppraisalHistoryResponse {
    private Long historyId;
    private Long appraisalId;
    private Long employeeId;
    private String staffName;
    private Long managerId;
    private String managerName;
    private Long cycleId;
    private String cycleName;
    private BigDecimal score;
    private String grade;
}
