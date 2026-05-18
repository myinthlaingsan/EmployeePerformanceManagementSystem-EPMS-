package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.dto.feedback360.FeedbackDraftRequest;
import ace.org.epms_backend.dto.feedback360.FeedbackDraftResponse;

public interface FeedbackDraftService {
    void saveDraft(Long evaluatorId, FeedbackDraftRequest request);
    FeedbackDraftResponse getDraft(Long evaluatorId, Long requestId);
}
