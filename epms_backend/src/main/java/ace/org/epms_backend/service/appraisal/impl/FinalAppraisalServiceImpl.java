package ace.org.epms_backend.service.appraisal.impl;

import ace.org.epms_backend.dto.appraisal.AppraisalSummaryResponse;
import ace.org.epms_backend.enums.FormType;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.appraisal.*;
import ace.org.epms_backend.repository.AppraisalRepository;
import ace.org.epms_backend.repository.AppraisalCycleRepository;
import ace.org.epms_backend.repository.AppraisalSummaryRepository;
import ace.org.epms_backend.repository.ScoringWeightRepository;
import ace.org.epms_backend.service.appraisal.FinalAppraisalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FinalAppraisalServiceImpl implements FinalAppraisalService {

    private final AppraisalRepository appraisalRepository;
    private final AppraisalSummaryRepository summaryRepository;
    private final ScoringWeightRepository weightRepository;
    private final AppraisalCycleRepository cycleRepository;

    @Override
    @Transactional
    public void generateFinalScore(Long employeeId, Long cycleId) {
        AppraisalCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new NotFoundException("Cycle not found"));

        List<Appraisal> appraisals = appraisalRepository.findAllByEmployee_IdAndCycle_CycleId(employeeId, cycleId);
        ScoringWeight weights = weightRepository.findById(1L).orElse(new ScoringWeight());

        BigDecimal managerScore = BigDecimal.ZERO;
        BigDecimal feedbackScore = BigDecimal.ZERO;
        BigDecimal selfScore = BigDecimal.ZERO;

        for (Appraisal a : appraisals) {
            FormType type = a.getForm().getFormType();
            if (type == FormType.MANAGER_EVALUATION) managerScore = a.getFormScore();
            else if (type == FormType.FEEDBACK) feedbackScore = a.getFormScore();
            else if (type == FormType.SELF_ASSESSMENT) selfScore = a.getFormScore();
        }

        BigDecimal totalScore = managerScore.multiply(weights.getManagerWeight())
                .add(feedbackScore.multiply(weights.getFeedbackWeight()))
                .add(selfScore.multiply(weights.getSelfWeight()));

        AppraisalSummary summary = summaryRepository.findByEmployeeIdAndCycle_CycleId(employeeId, cycleId)
                .orElse(new AppraisalSummary());

        summary.setEmployeeId(employeeId);
        summary.setCycle(cycle);
        summary.setTotalScore(totalScore.setScale(2, RoundingMode.HALF_UP));
        summary.setFinalGrade(calculateGrade(totalScore));

        summaryRepository.save(summary);
    }

    private String calculateGrade(BigDecimal score) {
        if (score.compareTo(new BigDecimal("90")) >= 0) return "A";
        if (score.compareTo(new BigDecimal("80")) >= 0) return "B";
        if (score.compareTo(new BigDecimal("70")) >= 0) return "C";
        if (score.compareTo(new BigDecimal("60")) >= 0) return "D";
        return "F";
    }

    @Override
    public AppraisalSummaryResponse getFinalResult(Long employeeId, Long cycleId) {
        AppraisalSummary summary = summaryRepository.findByEmployeeIdAndCycle_CycleId(employeeId, cycleId)
                .orElseThrow(() -> new NotFoundException("Summary not found"));

        AppraisalSummaryResponse response = new AppraisalSummaryResponse();
        response.setId(summary.getId());
        response.setEmployeeId(summary.getEmployeeId());
        response.setCycleId(summary.getCycle().getCycleId());
        response.setTotalScore(summary.getTotalScore());
        response.setFinalGrade(summary.getFinalGrade());
        return response;
    }
}
