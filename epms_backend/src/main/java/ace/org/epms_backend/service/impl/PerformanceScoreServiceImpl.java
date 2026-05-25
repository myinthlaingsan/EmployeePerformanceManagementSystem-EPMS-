package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.model.appraisal.ManagerEvaluation;
import ace.org.epms_backend.model.appraisal.SelfAssessment;
import ace.org.epms_backend.model.feedback360.Feedback;
import ace.org.epms_backend.model.feedback360.FeedbackSummary;
import ace.org.epms_backend.model.kpi.KpiFinalScore;
import ace.org.epms_backend.repository.KpiFinalScoreRepository;
import ace.org.epms_backend.repository.ManagerEvaluationRepository;
import ace.org.epms_backend.repository.SelfAssessmentRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackRepository;
import ace.org.epms_backend.service.PerformanceScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PerformanceScoreServiceImpl implements PerformanceScoreService {

    private final KpiFinalScoreRepository kpiFinalScoreRepo;
    private final SelfAssessmentRepository selfRepo;
    private final ManagerEvaluationRepository evalRepo;
    private final ace.org.epms_backend.repository.feedback360.FeedbackSummaryRepository feedbackSummaryRepo;
    private final FeedbackRepository feedbackRepo;

    @Override
    public BigDecimal getKpiTotalScore(Long employeeId, Long cycleId, Long appraisalId) {
        // Try to find by appraisalId first (most reliable)
        if (appraisalId != null) {
            Optional<KpiFinalScore> scoreByAppraisal = kpiFinalScoreRepo.findByAppraisal_AppraisalId(appraisalId);
            if (scoreByAppraisal.isPresent()) {
                return scoreByAppraisal.get().getTotalAchievementPercent();
            }
        }

        // Fallback to employeeId and cycleId
        return kpiFinalScoreRepo.findByEmployee_IdAndGoalSet_Cycle_CycleId(employeeId, cycleId)
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
    public BigDecimal getFeedbackTotalScore(Long employeeId, Long cycleId, Long appraisalId) {
        // Prefer persisted summary score (authoritative after calibration)
        Optional<FeedbackSummary> summaryOpt =
                feedbackSummaryRepo.findByEmployeeIdAndCycleCycleId(employeeId, cycleId);
        if (summaryOpt.isPresent()) {
            FeedbackSummary fs = summaryOpt.get();
            BigDecimal score = fs.getCalibratedFinalScore() != null
                    ? fs.getCalibratedFinalScore()
                    : fs.getFinalScore();
            if (score != null) return score;
        }
        // Fallback: compute from submitted feedback averageScores when summary not yet generated
        List<BigDecimal> avgScores = feedbackRepo
                .findByRequestTargetUserIdAndRequestCycleCycleId(employeeId, cycleId)
                .stream()
                .map(Feedback::getAverageScore)
                .filter(s -> s != null)
                .collect(Collectors.toList());
        if (avgScores.isEmpty()) return BigDecimal.ZERO;
        BigDecimal total = avgScores.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.divide(BigDecimal.valueOf(avgScores.size()), 2, RoundingMode.HALF_UP);
    }
}
