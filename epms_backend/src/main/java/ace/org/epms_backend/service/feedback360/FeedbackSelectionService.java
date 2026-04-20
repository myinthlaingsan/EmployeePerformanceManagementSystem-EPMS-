package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.dto.feedback360.EmployeeEvaluationDTO;

import java.util.List;

public interface FeedbackSelectionService {

    //DTO for suggested evaluator information
        List<EmployeeEvaluationDTO> suggestEvaluators(Long employeeId);

    void confirmEvaluators(Long targetEmployeeId, Long cycleId, List<EmployeeEvaluationDTO> selectedEvaluators);
}
