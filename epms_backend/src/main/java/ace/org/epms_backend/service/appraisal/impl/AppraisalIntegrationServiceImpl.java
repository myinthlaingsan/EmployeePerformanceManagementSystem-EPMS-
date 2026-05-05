package ace.org.epms_backend.service.appraisal.impl;

import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.appraisal.Appraisal;
import ace.org.epms_backend.model.appraisal.AppraisalSummary;
import ace.org.epms_backend.model.feedback360.FeedbackSummary;
import ace.org.epms_backend.repository.AppraisalRepository;
import ace.org.epms_backend.repository.AppraisalSummaryRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackSummaryRepository;
import ace.org.epms_backend.service.appraisal.AppraisalIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppraisalIntegrationServiceImpl implements AppraisalIntegrationService {

    private final AppraisalRepository appraisalRepository;
    private final AppraisalSummaryRepository summaryRepository;
    private final FeedbackSummaryRepository feedbackSummaryRepository;

    @Override
    @Transactional
    public void syncFeedbackToAppraisal(Long cycleId) {
        List<FeedbackSummary> summaries = feedbackSummaryRepository.findByCycleCycleId(cycleId);
        
        for (FeedbackSummary feedback : summaries) {
            // Find or create AppraisalSummary for this employee/cycle
            summaryRepository.findByEmployee_IdAndCycle_CycleId(feedback.getEmployee().getId(), cycleId)
                    .ifPresent(summary -> {
                        // We could store the raw feedback score here if we added a field to AppraisalSummary,
                        // but for now let's just ensure we have the summary record ready.
                        // The FinalAppraisalService will aggregate all scores including from feedback_summary table.
                        summaryRepository.save(summary);
                    });
        }
    }

    @Override
    public Appraisal getAppraisal(Long employeeId, Long cycleId) {
        return appraisalRepository.findByEmployee_IdAndCycle_CycleId(employeeId, cycleId)
                .orElseThrow(() -> new NotFoundException("Appraisal not found"));
    }

    @Override
    @Transactional
    public void updateFormScore(Long appraisalId, BigDecimal score) {
        // Since Appraisal has no score field, we might want to update the corresponding 
        // ManagerEvaluation or SelfAssessment score, or update AppraisalSummary directly.
        Appraisal appraisal = appraisalRepository.findById(appraisalId)
                .orElseThrow(() -> new NotFoundException("Appraisal not found"));
        
        AppraisalSummary summary = summaryRepository.findByEmployee_IdAndCycle_CycleId(
                appraisal.getEmployee().getId(), appraisal.getCycle().getCycleId())
                .orElseGet(() -> {
                    AppraisalSummary s = new AppraisalSummary();
                    s.setEmployee(appraisal.getEmployee());
                    s.setCycle(appraisal.getCycle());
                    return s;
                });
        
        summary.setTotalScore(score);
        summaryRepository.save(summary);
    }
}
