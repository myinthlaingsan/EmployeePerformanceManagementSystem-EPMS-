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
    PagedResponse<ContinuousFeedbackResponse> getFeedbacksByEmployee(Long employeeId, ace.org.epms_backend.enums.FeedbackType feedbackType, Long tagId, java.time.LocalDate createdAfter, java.time.LocalDate createdBefore, int page, int size);
    PagedResponse<ContinuousFeedbackResponse> getFeedbacksByManager(Long managerId, ace.org.epms_backend.enums.ContinuousStatus status, ace.org.epms_backend.enums.FeedbackType feedbackType, Long tagId, java.time.LocalDate createdAfter, java.time.LocalDate createdBefore, int page, int size);
    ace.org.epms_backend.dto.continuous.ContinuousStatsResponse getFeedbackStatsForManager(Long managerId);
    PagedResponse<ContinuousFeedbackResponse> getAllFeedbacks(ace.org.epms_backend.enums.ContinuousStatus status, ace.org.epms_backend.enums.FeedbackType feedbackType, Long tagId, java.time.LocalDate createdAfter, java.time.LocalDate createdBefore, int page, int size);
    ContinuousFeedbackResponse updateFeedback(Long feedbackId, ContinuousFeedbackRequest request);
    void deleteFeedback(Long feedbackId);
    ContinuousFeedbackResponse publishFeedback(Long feedbackId);
    ace.org.epms_backend.dto.continuous.ContinuousStatsResponse getFeedbackStats(Long employeeId);

    FeedbackReplyResponse replyToFeedback(Long feedbackId, FeedbackReplyRequest request);
    List<FeedbackReplyResponse> getRepliesForFeedback(Long feedbackId);
    FeedbackReplyResponse updateReply(Long replyId, FeedbackReplyRequest request);
    void deleteReply(Long replyId);
}
