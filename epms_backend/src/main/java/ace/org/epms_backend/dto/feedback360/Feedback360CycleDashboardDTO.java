package ace.org.epms_backend.dto.feedback360;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Feedback360CycleDashboardDTO {
    private Long totalTargets;
    private Long totalRequests;
    private Long submittedRequests;
    private Long pendingRequests;
    private Long overdueRequests;
    private Long cancelledRequests;
    private Double submissionRate;
    private Map<String, Double> relationshipRates;
    private List<Feedback360BottleneckDTO> bottlenecks;
    private Boolean isFinalized;
}
