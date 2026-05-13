package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.model.appraisal.ManagerEvaluation;
import ace.org.epms_backend.model.appraisal.SelfAssessment;
import ace.org.epms_backend.model.kpi.KpiFinalScore;
import ace.org.epms_backend.repository.KpiFinalScoreRepository;
import ace.org.epms_backend.repository.ManagerEvaluationRepository;
import ace.org.epms_backend.repository.SelfAssessmentRepository;
import ace.org.epms_backend.service.PerformanceScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PerformanceScoreServiceImpl implements PerformanceScoreService {

    private final KpiFinalScoreRepository kpiFinalScoreRepo;
    private final SelfAssessmentRepository selfRepo;
    private final ManagerEvaluationRepository evalRepo;
    private final ace.org.epms_backend.repository.feedback360.FeedbackSummaryRepository feedbackSummaryRepo;

    @Override
    public BigDecimal getKpiTotalScore(Long employeeId, Long cycleId) {
        return kpiFinalScoreRepo.findByEmployeeIdAndCycleId(employeeId, cycleId)
                .map(KpiFinalScore::getTotalAchievementPercent)
                .orElse(BigDecimal.ZERO);
    }

    @Override
    public BigDecimal getSelfAssessmentTotalScore(Long appraisalId) {
        return selfRepo.findByAppraisal_AppraisalId(appraisalId)
                .map(SelfAssessment::getTotalScore)
                .orElse(BigDecimal.ZERO);
    }

    @Override
    public BigDecimal getManagerEvaluationTotalScore(Long appraisalId) {
        return evalRepo.findByAppraisal_AppraisalId(appraisalId)
                .map(ManagerEvaluation::getTotalScore)
                .orElse(BigDecimal.ZERO);
    }

    @Override
    public BigDecimal getFeedbackTotalScore(Long employeeId, Long cycleId) {
        return feedbackSummaryRepo.findByEmployeeIdAndCycleCycleId(employeeId, cycleId)
                .map(fs -> fs.getFinalScore())
                .orElse(BigDecimal.ZERO);
    }
}
