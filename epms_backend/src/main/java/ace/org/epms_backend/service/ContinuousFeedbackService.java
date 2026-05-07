package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.PagedResponse;
import ace.org.epms_backend.dto.continuous.ContinuousFeedbackRequest;
import ace.org.epms_backend.dto.continuous.ContinuousFeedbackResponse;
import ace.org.epms_backend.dto.continuous.FeedbackReplyRequest;
import ace.org.epms_backend.dto.continuous.FeedbackReplyResponse;

import java.util.List;

public interface ContinuousFeedbackService {
    ContinuousFeedbackResponse createFeedback(ContinuousFeedbackRequest request);
    ContinuousFeedbackResponse getFeedbackById(Long feedbackId);
    PagedResponse<ContinuousFeedbackResponse> getFeedbacksByEmployee(Long employeeId, int page, int size);
    PagedResponse<ContinuousFeedbackResponse> getFeedbacksByManager(Long managerId, int page, int size);
    PagedResponse<ContinuousFeedbackResponse> getAllFeedbacks(int page, int size);
    ContinuousFeedbackResponse updateFeedback(Long feedbackId, ContinuousFeedbackRequest request);
    void deleteFeedback(Long feedbackId);

    FeedbackReplyResponse replyToFeedback(Long feedbackId, FeedbackReplyRequest request);
    List<FeedbackReplyResponse> getRepliesForFeedback(Long feedbackId);
    FeedbackReplyResponse updateReply(Long replyId, FeedbackReplyRequest request);
    void deleteReply(Long replyId);
}
