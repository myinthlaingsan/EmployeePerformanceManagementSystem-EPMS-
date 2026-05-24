package ace.org.epms_backend.dto.feedback360;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ManagerReviewRequest {
    private String managerSummary;
    private BigDecimal calibratedFinalScore;
}
