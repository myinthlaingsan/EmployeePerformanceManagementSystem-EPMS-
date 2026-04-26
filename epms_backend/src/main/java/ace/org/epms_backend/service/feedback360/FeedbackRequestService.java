package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.dto.feedback360.FeedbackRequestResponse;
import java.util.List;

public interface FeedbackRequestService {
    void generate360FeedbackRequests(Long cycleId, int minPeers, int maxPeers, int minSubs, int maxSubs);
    List<FeedbackRequestResponse> getMyPendingRequests(Long employeeId);
}
