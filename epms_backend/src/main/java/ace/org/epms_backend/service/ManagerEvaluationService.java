package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.appraisal.*;
import java.util.List;

public interface ManagerEvaluationService {
    
    ManagerEvaluationResponse create(ManagerEvaluationRequest request);

    FullManagerEvaluationResponse getEvaluationForm(Long appraisalId);

    void saveAnswers(Long evaluationId, List<ManagerEvaluationAnswerRequest> answers);

    void saveDraft(Long evaluationId, String finalComment);

    void submitFinal(Long evaluationId);

    EmployeeSelfAssessmentViewResponse getEmployeeView(Long appraisalId);
}
