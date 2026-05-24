package ace.org.epms_backend.service;

import java.math.BigDecimal;

public interface PerformanceScoreService {
    BigDecimal getKpiTotalScore(Long employeeId, Long cycleId, Long appraisalId);
    BigDecimal getSelfAssessmentTotalScore(Long appraisalId);
    BigDecimal getManagerEvaluationTotalScore(Long appraisalId);
    BigDecimal getFeedbackTotalScore(Long employeeId, Long cycleId, Long appraisalId);
}
