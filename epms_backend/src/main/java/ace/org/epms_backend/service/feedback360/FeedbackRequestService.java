package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.dto.feedback360.FeedbackRequestGenerateDTO;
import ace.org.epms_backend.dto.feedback360.FeedbackRequestResponse;
import ace.org.epms_backend.dto.feedback360.GenerationValidationResponse;
import java.util.List;
import java.util.Map;

public interface FeedbackRequestService {
    void generate360FeedbackRequests(Long cycleId, Long previousCycleId, int globalMaxLimit, boolean excludeLongTermLeave);

    List<FeedbackRequestResponse> preview360FeedbackRequests(Long cycleId, Long previousCycleId, int globalMaxLimit, boolean excludeLongTermLeave);

    void regenerateUserFeedbackRequests(Long targetEmployeeId, Long cycleId, Long previousCycleId, int globalMaxLimit);

    void finalizeEvaluators(Long cycleId);

    void regenerateAll(Long cycleId, Long previousCycleId, int globalMaxLimit, boolean excludeLongTermLeave);

    GenerationValidationResponse validate360Generation(Long cycleId, boolean excludeLongTermLeave);

    void generateRequests(FeedbackRequestGenerateDTO dto);

    List<FeedbackRequestResponse> getMyPendingRequests(Long evaluatorId);

    List<FeedbackRequestResponse> getRequestsByEmployee(Long targetEmployeeId, Long cycleId);

    List<FeedbackRequestResponse> getRequestsByCycle(Long cycleId);

    Map<String, Long> getRequestStatusCountByCycle(Long cycleId);

    FeedbackRequestResponse getRequest(Long requestId);

    void resetCycleStatus(Long cycleId);
}