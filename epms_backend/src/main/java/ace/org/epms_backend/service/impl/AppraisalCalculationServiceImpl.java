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
import ace.org.epms_backend.service.PerformanceScoreService;
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
        private final AppraisalSummaryRepository summaryRepo;
        private final PerformanceCategoryRepository performanceCategoryRepo;
        private final ScoringWeightRepository weightRepo;
        private final FeedbackSummaryRepository feedbackSummaryRepo;
        private final PerformanceScoreService performanceScoreService;
        private final ApplicationEventPublisher eventPublisher;

        @Override
        @Transactional(readOnly = true)
        public ScoreBreakdownResponse getScoreBreakdown(Long appraisalId) {
                Appraisal appraisal = appraisalRepo.findById(appraisalId)
                                .orElseThrow(() -> new NotFoundException("Appraisal not found"));
                return buildBreakdown(appraisal);
        }

        @Override
        @Transactional
        public ScoreBreakdownResponse calculateScore(Long appraisalId) {
                Appraisal appraisal = appraisalRepo.findById(appraisalId)
                                .orElseThrow(() -> new NotFoundException("Appraisal not found"));

                ScoreBreakdownResponse breakdown = buildBreakdown(appraisal);

                // Save Summary
                AppraisalSummary summary = summaryRepo
                                .findByEmployee_IdAndCycle_CycleId(appraisal.getEmployee().getId(),
                                                appraisal.getCycle().getCycleId())
                                .orElseGet(() -> {
                                        AppraisalSummary newSummary = new AppraisalSummary();
                                        newSummary.setEmployee(appraisal.getEmployee());
                                        newSummary.setCycle(appraisal.getCycle());
                                        return newSummary;
                                });

                summary.setTotalScore(breakdown.getFinalTotalScore());
                summary.setFinalGrade(breakdown.getFinalGrade());
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

                return breakdown;
        }

        private ScoreBreakdownResponse buildBreakdown(Appraisal appraisal) {
                Long appraisalId = appraisal.getAppraisalId();
                Long employeeId = appraisal.getEmployee().getId();
                Long cycleId = appraisal.getCycle().getCycleId();

                // 1. Fetch Scores using PerformanceScoreService
                BigDecimal selfRaw = performanceScoreService.getSelfAssessmentTotalScore(appraisalId);
                BigDecimal managerRaw = performanceScoreService.getManagerEvaluationTotalScore(appraisalId);
                BigDecimal kpiRaw = performanceScoreService.getKpiTotalScore(employeeId, cycleId, appraisalId);
                BigDecimal feedbackRaw = performanceScoreService.getFeedbackTotalScore(employeeId, cycleId, appraisalId);

                // Check for completeness - all components must have a score recorded
                // Note: We use compareTo(ZERO) != 0 as a simple check, but presence in DB is more robust.
                // However, the user said "if score are not completed", so we should check if they were actually submitted.
                
                // 2. Fetch Weights (DB stores as percentage, e.g. 20.00 = 20%)
                ScoringWeight weights = weightRepo.findByCycle_CycleId(cycleId)
                                .orElseGet(() -> {
                                        // Fallback defaults in % format to match DB convention
                                        ScoringWeight w = new ScoringWeight();
                                        w.setSelfWeight(new BigDecimal("10"));
                                        w.setManagerWeight(new BigDecimal("30"));
                                        w.setFeedbackWeight(new BigDecimal("20"));
                                        w.setKpiWeight(new BigDecimal("40"));
                                        return w;
                                });

                // 3. Calculate Weighted Scores (weights stored as % e.g. 20.00 = 20%)
                BigDecimal HUNDRED = new BigDecimal("100");
                BigDecimal selfW    = (weights.getSelfWeight()     != null ? weights.getSelfWeight()     : BigDecimal.ZERO).divide(HUNDRED);
                BigDecimal managerW = (weights.getManagerWeight()  != null ? weights.getManagerWeight()  : BigDecimal.ZERO).divide(HUNDRED);
                BigDecimal feedbackW= (weights.getFeedbackWeight() != null ? weights.getFeedbackWeight() : BigDecimal.ZERO).divide(HUNDRED);
                BigDecimal kpiW     = (weights.getKpiWeight()      != null ? weights.getKpiWeight()      : BigDecimal.ZERO).divide(HUNDRED);

                BigDecimal selfWeighted     = selfRaw    .multiply(selfW);
                BigDecimal managerWeighted  = managerRaw .multiply(managerW);
                BigDecimal feedbackWeighted = feedbackRaw.multiply(feedbackW);
                BigDecimal kpiWeighted      = kpiRaw     .multiply(kpiW);

                BigDecimal finalScore = selfWeighted.add(managerWeighted).add(feedbackWeighted).add(kpiWeighted)
                                .setScale(2, RoundingMode.HALF_UP);

                // 4. Determine Grade
                PerformanceGrade grade = determineGrade(finalScore);

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
