package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.appraisal.*;
import java.util.List;

public interface SelfAssessmentService {

    FullSelfAssessmentResponse getMyAssessmentForm(Long appraisalId);

    void saveAnswers(Long selfAssessmentId, List<SelfAssessmentAnswerRequest> answers);

    void saveDraft(Long selfAssessmentId);

    void submitFinal(Long selfAssessmentId);

    List<SelfAssessmentResponse> getMyAssessments(Long employeeId);
}
