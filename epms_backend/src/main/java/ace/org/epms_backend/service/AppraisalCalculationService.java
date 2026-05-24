package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.appraisal.ScoreBreakdownResponse;

public interface AppraisalCalculationService {
    ScoreBreakdownResponse calculateScore(Long appraisalId);
    ScoreBreakdownResponse getScoreBreakdown(Long appraisalId);
}
