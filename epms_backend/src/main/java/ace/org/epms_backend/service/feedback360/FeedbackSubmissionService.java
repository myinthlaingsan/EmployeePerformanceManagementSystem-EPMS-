package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.dto.feedback360.FeedbackDetailsResponse;
import ace.org.epms_backend.dto.feedback360.FeedbackSubmissionRequest;
import java.util.List;

public interface FeedbackSubmissionService {
    void submitFeedback(FeedbackSubmissionRequest request, Long evaluatorId);
    FeedbackDetailsResponse getFeedbackByRequest(Long requestId);
    List<FeedbackDetailsResponse> getMySubmittedFeedbacks(Long evaluatorId);
    List<FeedbackDetailsResponse> getFeedbackReceivedByEmployee(Long employeeId, Long cycleId);
    List<FeedbackDetailsResponse> getAllFeedbackForAudit(Long employeeId, Long cycleId);
    void deleteFeedback(Long feedbackId);
}
