package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.appraisal.ScoreBreakdownResponse;
import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.PerformanceGrade;
import ace.org.epms_backend.enums.ReferenceType;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.PerformanceCategory;
import ace.org.epms_backend.model.appraisal.*;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.AppraisalCalculationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppraisalCalculationServiceImpl implements AppraisalCalculationService {

    private final AppraisalRepository appraisalRepo;
    private final SelfAssessmentAnswerRepository selfAnswerRepo;
    private final ManagerEvaluationAnswerRepository mgrAnswerRepo;
    private final AppraisalSummaryRepository summaryRepo;
    private final PerformanceCategoryRepository performanceCategoryRepo;
    private final ScoringWeightRepository weightRepo;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public ScoreBreakdownResponse calculateScore(Long appraisalId) {
        Appraisal appraisal = appraisalRepo.findById(appraisalId)
                .orElseThrow(() -> new NotFoundException("Appraisal not found"));

        // 1. Calculate Raw Scores
        BigDecimal selfRaw = calculateAverageRating(
                selfAnswerRepo.findBySelfAssessment_Appraisal_AppraisalId(appraisalId));
        BigDecimal managerRaw = calculateAverageRating(
                mgrAnswerRepo.findByEvaluation_Appraisal_AppraisalId(appraisalId));
        BigDecimal kpiRaw = BigDecimal.ZERO;
        BigDecimal feedbackRaw = BigDecimal.ZERO;

        // 2. Fetch Weights
        ScoringWeight weights = weightRepo.findByCycle_CycleId(appraisal.getCycle().getCycleId())
                .orElseGet(() -> {
                    ScoringWeight w = new ScoringWeight();
                    w.setSelfWeight(new BigDecimal("0.2"));
                    w.setManagerWeight(new BigDecimal("0.5"));
                    w.setFeedbackWeight(new BigDecimal("0.3"));
                    w.setKpiWeight(BigDecimal.ZERO);
                    return w;
                });

        // 3. Calculate Weighted Scores
        BigDecimal selfWeighted = selfRaw
                .multiply(weights.getSelfWeight() != null ? weights.getSelfWeight() : BigDecimal.ZERO);
        BigDecimal managerWeighted = managerRaw
                .multiply(weights.getManagerWeight() != null ? weights.getManagerWeight() : BigDecimal.ZERO);
        BigDecimal feedbackWeighted = feedbackRaw
                .multiply(weights.getFeedbackWeight() != null ? weights.getFeedbackWeight() : BigDecimal.ZERO);
        BigDecimal kpiWeighted = kpiRaw
                .multiply(weights.getKpiWeight() != null ? weights.getKpiWeight() : BigDecimal.ZERO);

        BigDecimal finalScore = selfWeighted.add(managerWeighted).add(feedbackWeighted).add(kpiWeighted)
                .setScale(2, RoundingMode.HALF_UP);

        // 4. Determine Grade
        PerformanceGrade grade = determineGrade(finalScore);

        // 5. Save Summary
        AppraisalSummary summary = summaryRepo
                .findByEmployee_IdAndCycle_CycleId(appraisal.getEmployee().getId(), appraisal.getCycle().getCycleId())
                .orElseGet(() -> {
                    AppraisalSummary newSummary = new AppraisalSummary();
                    newSummary.setEmployee(appraisal.getEmployee());
                    newSummary.setCycle(appraisal.getCycle());
                    return newSummary;
                });

        summary.setTotalScore(finalScore);
        summary.setFinalGrade(grade);
        summaryRepo.save(summary);

        // Notify Summary Ready
        eventPublisher.publishEvent(NotificationEvent.builder()
                .broadcast(true)
                .type(NotificationType.APPRAISAL_SUMMARY_READY)
                .title("Appraisal Calculated")
                .message("Final results are ready for " + appraisal.getEmployee().getStaffName())
                .referenceType(ReferenceType.APPRAISAL)
                .referenceId(appraisalId)
                .build());

        // 6. Build Detailed Response
        return ScoreBreakdownResponse.builder()
                .appraisalId(appraisalId)
                .selfRawScore(selfRaw)
                .managerRawScore(managerRaw)
                .kpiRawScore(kpiRaw)
                .feedbackRawScore(feedbackRaw)
                .selfWeight(weights.getSelfWeight())
                .managerWeight(weights.getManagerWeight())
                .feedbackWeight(weights.getFeedbackWeight())
                .kpiWeight(weights.getKpiWeight())
                .selfWeightedScore(selfWeighted)
                .managerWeightedScore(managerWeighted)
                .feedbackWeightedScore(feedbackWeighted)
                .kpiWeightedScore(kpiWeighted)
                .finalTotalScore(finalScore)
                .finalGrade(grade)
                .build();
    }

    private BigDecimal calculateAverageRating(List<?> answers) {
        if (answers == null || answers.isEmpty())
            return BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;
        int count = 0;
        for (Object obj : answers) {
            Integer rating = null;
            if (obj instanceof SelfAssessmentAnswer)
                rating = ((SelfAssessmentAnswer) obj).getRatingValue();
            else if (obj instanceof ManagerEvaluationAnswer)
                rating = ((ManagerEvaluationAnswer) obj).getRatingValue();
            if (rating != null) {
                total = total.add(BigDecimal.valueOf(rating));
                count++;
            }
        }
        return count == 0 ? BigDecimal.ZERO : total.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
    }

    private PerformanceGrade determineGrade(BigDecimal score) {
        List<PerformanceCategory> categories = performanceCategoryRepo.findAll();
        for (PerformanceCategory cat : categories) {
            if (score.compareTo(cat.getMinScore()) >= 0 && score.compareTo(cat.getMaxScore()) <= 0) {
                for (PerformanceGrade pg : PerformanceGrade.values()) {
                    if (pg.name().equalsIgnoreCase(cat.getName().replace(" ", "_")))
                        return pg;
                }
            }
        }
        return PerformanceGrade.MEETS_EXPECTATIONS;
    }
}
