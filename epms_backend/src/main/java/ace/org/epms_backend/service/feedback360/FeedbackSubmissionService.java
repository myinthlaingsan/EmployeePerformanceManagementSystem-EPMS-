package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.dto.feedback360.FeedbackSubmissionRequest;

public interface FeedbackSubmissionService {
    void submitFeedback(FeedbackSubmissionRequest request, Long evaluatorId);
}
