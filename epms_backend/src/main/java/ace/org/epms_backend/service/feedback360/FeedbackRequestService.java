package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.dto.feedback360.FeedbackRequestGenerateDTO;
import ace.org.epms_backend.dto.feedback360.FeedbackRequestResponse;
import java.util.List;

public interface FeedbackRequestService {
    void generate360FeedbackRequests(Long cycleId, Long previousCycleId, int globalMaxLimit, boolean excludeLongTermLeave);

    List<FeedbackRequestResponse> preview360FeedbackRequests(Long cycleId, Long previousCycleId, int globalMaxLimit, boolean excludeLongTermLeave);

    void regenerateUserFeedbackRequests(Long targetEmployeeId, Long cycleId, Long previousCycleId, int globalMaxLimit);

    List<FeedbackRequestResponse> getMyPendingRequests(Long evaluatorId);

    void cancelFeedbackRequest(Long requestId);

    void reassignFeedbackRequest(Long requestId, Long newEvaluatorId);
}