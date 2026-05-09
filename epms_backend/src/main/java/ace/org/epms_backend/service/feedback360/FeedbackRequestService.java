package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.dto.feedback360.FeedbackRequestGenerateDTO;
import ace.org.epms_backend.dto.feedback360.FeedbackRequestResponse;
import ace.org.epms_backend.enums.FeedbackStatus;
import java.util.List;

public interface FeedbackRequestService {
    void generate360FeedbackRequests(Long cycleId, Long previousCycleId, int globalMaxLimit, boolean excludeLongTermLeave);

    List<ace.org.epms_backend.dto.feedback360.FeedbackRequestResponse> preview360FeedbackRequests(Long cycleId, Long previousCycleId, int globalMaxLimit, boolean excludeLongTermLeave);

    void regenerateUserFeedbackRequests(Long targetEmployeeId, Long cycleId, Long previousCycleId, int globalMaxLimit);


    void generateRequests(FeedbackRequestGenerateDTO dto);

    List<FeedbackRequestResponse> getMyPendingRequests(Long evaluatorId);

    /*
    List<FeedbackRequestResponse> getRequestsByEmployee(Long targetEmployeeId, Long cycleId);

    List<FeedbackRequestResponse> getRequestsByCycle(Long cycleId);

    */
    FeedbackRequestResponse getRequest(Long requestId);
    /*

    void updateRequestStatus(Long requestId, FeedbackStatus status);

    void deleteRequest(Long requestId);
    */
}