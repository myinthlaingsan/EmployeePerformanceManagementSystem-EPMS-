package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.continuous.ContinuousFeedbackRequest;
import ace.org.epms_backend.dto.continuous.ContinuousFeedbackResponse;
import ace.org.epms_backend.dto.continuous.FeedbackReplyRequest;
import ace.org.epms_backend.dto.continuous.FeedbackReplyResponse;

import java.util.List;

public interface ContinuousFeedbackService {
    ContinuousFeedbackResponse createFeedback(ContinuousFeedbackRequest request);
    ContinuousFeedbackResponse getFeedbackById(Long feedbackId);
    List<ContinuousFeedbackResponse> getFeedbacksByEmployee(Long employeeId);
    List<ContinuousFeedbackResponse> getFeedbacksByManager(Long managerId);
    List<ContinuousFeedbackResponse> getAllFeedbacks();
    ContinuousFeedbackResponse updateFeedback(Long feedbackId, ContinuousFeedbackRequest request);
    void deleteFeedback(Long feedbackId);

    FeedbackReplyResponse replyToFeedback(Long feedbackId, FeedbackReplyRequest request);
    List<FeedbackReplyResponse> getRepliesForFeedback(Long feedbackId);
    void deleteReply(Long replyId);
}
