package ace.org.epms_backend.service.appraisal.impl;

import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.appraisal.Appraisal;
import ace.org.epms_backend.model.feedback360.FeedbackSummary;
import ace.org.epms_backend.repository.AppraisalRepository;
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
    private final FeedbackSummaryRepository feedbackSummaryRepository;

    @Override
    @Transactional
    public void syncFeedbackToAppraisal(Long cycleId) {
        List<FeedbackSummary> summaries = feedbackSummaryRepository.findByCycleCycleId(cycleId);
        
        for (FeedbackSummary summary : summaries) {
            // Find existing appraisal for this employee and cycle
            appraisalRepository.findByEmployee_IdAndCycle_CycleId(summary.getEmployee().getId(), cycleId)
                    .ifPresent(appraisal -> {
                        appraisal.setFormScore(summary.getFinalScore());
                        appraisalRepository.save(appraisal);
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
        Appraisal appraisal = appraisalRepository.findById(appraisalId)
                .orElseThrow(() -> new NotFoundException("Appraisal not found"));
        appraisal.setFormScore(score);
        appraisalRepository.save(appraisal);
    }
}
