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
import ace.org.epms_backend.repository.feedback360.FeedbackSummaryRepository;
import ace.org.epms_backend.service.AppraisalCalculationService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppraisalCalculationServiceImpl implements AppraisalCalculationService {

        private final AppraisalRepository appraisalRepo;
        private final SelfAssessmentRepository selfRepo;
        private final ManagerEvaluationRepository evalRepo;
        private final AppraisalSummaryRepository summaryRepo;
        private final PerformanceCategoryRepository performanceCategoryRepo;
        private final ScoringWeightRepository weightRepo;
        private final KpiFinalScoreRepository kpiFinalScoreRepo;
        private final FeedbackSummaryRepository feedbackSummaryRepo;
        private final ApplicationEventPublisher eventPublisher;

        @Override
        @Transactional
        public ScoreBreakdownResponse calculateScore(Long appraisalId) {
                Appraisal appraisal = appraisalRepo.findById(appraisalId)
                                .orElseThrow(() -> new NotFoundException("Appraisal not found"));

                // 1. Fetch Pre-calculated Percentage Scores (0-100)
                BigDecimal selfRaw = selfRepo.findByAppraisal_AppraisalId(appraisalId)
                                .map(SelfAssessment::getTotalScore).orElse(BigDecimal.ZERO);

                BigDecimal managerRaw = evalRepo.findByAppraisal_AppraisalId(appraisalId)
                                .map(ManagerEvaluation::getTotalScore).orElse(BigDecimal.ZERO);

                // 1.1 Fetch KPI Final Score (already 0-100%)
                BigDecimal kpiRaw = kpiFinalScoreRepo.findByEmployeeIdAndCycleId(
                                appraisal.getEmployee().getId(), appraisal.getCycle().getCycleId())
                                .map(kpi -> kpi.getTotalAchievementPercent())
                                .orElse(BigDecimal.ZERO);

                // 1.2 Fetch 360 Feedback Summary Score (already 0-100)
                BigDecimal feedbackRaw = feedbackSummaryRepo.findByEmployeeIdAndCycleCycleId(
                                appraisal.getEmployee().getId(), appraisal.getCycle().getCycleId())
                                .map(fs -> fs.getFinalScore())
                                .orElse(BigDecimal.ZERO);

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
                                .multiply(weights.getManagerWeight() != null ? weights.getManagerWeight()
                                                : BigDecimal.ZERO);
                BigDecimal feedbackWeighted = feedbackRaw
                                .multiply(weights.getFeedbackWeight() != null ? weights.getFeedbackWeight()
                                                : BigDecimal.ZERO);
                BigDecimal kpiWeighted = kpiRaw
                                .multiply(weights.getKpiWeight() != null ? weights.getKpiWeight() : BigDecimal.ZERO);

                BigDecimal finalScore = selfWeighted.add(managerWeighted).add(feedbackWeighted).add(kpiWeighted)
                                .setScale(2, RoundingMode.HALF_UP);

                // 4. Determine Grade
                PerformanceGrade grade = determineGrade(finalScore);

                // 5. Save Summary
                AppraisalSummary summary = summaryRepo
                                .findByEmployee_IdAndCycle_CycleId(appraisal.getEmployee().getId(),
                                                appraisal.getCycle().getCycleId())
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

        private PerformanceGrade determineGrade(BigDecimal score) {
                List<PerformanceCategory> categories = performanceCategoryRepo.findAll();
                for (PerformanceCategory cat : categories) {
                        if (score.compareTo(cat.getMinScore()) >= 0 && score.compareTo(cat.getMaxScore()) <= 0) {
                                return cat.getGrade() != null ? cat.getGrade() : PerformanceGrade.MEETS_EXPECTATIONS;
                        }
                }
                return PerformanceGrade.MEETS_EXPECTATIONS;
        }
}
