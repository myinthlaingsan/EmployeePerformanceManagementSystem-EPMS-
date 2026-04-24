package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.appraisal.*;
import java.util.List;

public interface SelfAssessmentService {
    SelfAssessmentResponse create(SelfAssessmentRequest request);
    void saveAnswers(Long selfAssessmentId, List<SelfAssessmentAnswerRequest> answers);
    List<SelfAssessmentAnswerResponse> getAnswers(Long selfAssessmentId);
    void submitFinal(Long selfAssessmentId);
    
    // Keeping for compatibility if needed, but marked as legacy
    void submitSelfAssessment(SelfAssessmentSubmitRequest request);
}
