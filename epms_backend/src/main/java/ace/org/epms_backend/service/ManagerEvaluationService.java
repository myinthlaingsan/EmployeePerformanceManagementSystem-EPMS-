package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.appraisal.*;
import java.util.List;

public interface ManagerEvaluationService {
    ManagerEvaluationResponse create(ManagerEvaluationCreateRequest request);
    void saveAnswers(Long evaluationId, List<ManagerEvaluationAnswerRequest> answers);
    List<ManagerEvaluationAnswerResponse> getAnswers(Long evaluationId);
    void submitFinal(Long evaluationId);

    // Legacy support
    void submitEvaluation(ManagerEvaluationRequest request);
}
