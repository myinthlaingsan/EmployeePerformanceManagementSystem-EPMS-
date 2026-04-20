package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.appraisal.SelfAssessmentSubmitRequest;

public interface SelfAssessmentService {
    void submitSelfAssessment(SelfAssessmentSubmitRequest request);
}
