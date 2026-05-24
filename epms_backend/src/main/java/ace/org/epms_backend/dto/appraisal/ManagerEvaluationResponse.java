package ace.org.epms_backend.dto.appraisal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagerEvaluationResponse {
    private Long evaluationId;
    private Long appraisalId;
    private BigDecimal totalScore;
    private Boolean submitted;
    private Instant lastSavedAt;
    private String finalComment;
    private Instant submittedAt;
}

