package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.dto.appraisal.FullFormResponse;

public interface FeedbackFormService {
    FullFormResponse getQuestionsForRequest(Long requestId);
}
