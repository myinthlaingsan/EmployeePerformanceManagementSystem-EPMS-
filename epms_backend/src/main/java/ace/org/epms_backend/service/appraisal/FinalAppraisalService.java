package ace.org.epms_backend.service.appraisal;

import ace.org.epms_backend.dto.appraisal.AppraisalSummaryResponse;
import java.util.List;

public interface FinalAppraisalService {
    void generateFinalScore(Long employeeId, Long cycleId);
    AppraisalSummaryResponse getFinalResult(Long employeeId, Long cycleId);
}
