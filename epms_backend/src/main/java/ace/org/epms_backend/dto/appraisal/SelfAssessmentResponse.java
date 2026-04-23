package ace.org.epms_backend.dto.appraisal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SelfAssessmentResponse {
    private Long selfAssessmentId;
    private Long appraisalId;
    private Instant submittedAt;
}
