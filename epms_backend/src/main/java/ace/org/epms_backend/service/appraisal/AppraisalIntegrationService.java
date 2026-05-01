package ace.org.epms_backend.service.appraisal;


import ace.org.epms_backend.model.appraisal.Appraisal;
import java.math.BigDecimal;

public interface AppraisalIntegrationService {
    void syncFeedbackToAppraisal(Long cycleId);
    Appraisal getAppraisal(Long employeeId, Long cycleId);
    void updateFormScore(Long appraisalId, BigDecimal score);
}
