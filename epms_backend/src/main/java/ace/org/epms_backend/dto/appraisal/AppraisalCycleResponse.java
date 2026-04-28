package ace.org.epms_backend.dto.appraisal;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AppraisalCycleResponse {
    private Long cycleId;
    private String cycleName;
}
