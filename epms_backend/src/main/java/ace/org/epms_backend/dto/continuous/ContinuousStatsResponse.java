package ace.org.epms_backend.dto.continuous;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ContinuousStatsResponse {
    private long totalPublished;
    private long totalDraft;
}
