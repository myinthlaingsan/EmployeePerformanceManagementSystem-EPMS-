package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.dto.appraisal.FullFormResponse;

import ace.org.epms_backend.dto.feedback360.FeedbackFormCreationRequest;

public interface FeedbackFormService {
    FullFormResponse getQuestionsForRequest(Long requestId);
    FullFormResponse getFeedbackFormForCycle(Long cycleId);
    Long saveFeedbackFormForCycle(Long cycleId, FeedbackFormCreationRequest request);
}
