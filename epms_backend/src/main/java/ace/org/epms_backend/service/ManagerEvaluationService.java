package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.appraisal.ManagerEvaluationRequest;

public interface ManagerEvaluationService {
    void submitEvaluation(ManagerEvaluationRequest request);
}
