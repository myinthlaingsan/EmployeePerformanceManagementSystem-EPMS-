package ace.org.epms_backend.service.appraisal.impl;

import ace.org.epms_backend.dto.appraisal.AppraisalSummaryResponse;
import ace.org.epms_backend.enums.PerformanceGrade;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.AppraisalSummaryMapper;
import ace.org.epms_backend.model.appraisal.*;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.feedback360.FeedbackSummary;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.repository.EmployeeRepository;

import ace.org.epms_backend.repository.feedback360.FeedbackSummaryRepository;
import ace.org.epms_backend.service.appraisal.FinalAppraisalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FinalAppraisalServiceImpl implements FinalAppraisalService {

    private final AppraisalRepository appraisalRepository;
    private final AppraisalSummaryRepository summaryRepository;
    private final ScoringWeightRepository weightRepository;
    private final AppraisalCycleRepository cycleRepository;
    private final EmployeeRepository employeeRepository;
    private final ManagerEvaluationRepository managerEvaluationRepository;
    private final SelfAssessmentRepository selfAssessmentRepository;
    private final FeedbackSummaryRepository feedbackSummaryRepository;
    private final AppraisalSummaryMapper summaryMapper;

    @Override
    @Transactional
    public void generateFinalScore(Long employeeId, Long cycleId) {
        AppraisalCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new NotFoundException("Cycle not found"));
        
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        // Find the main appraisal for this employee/cycle
        Appraisal appraisal = appraisalRepository.findByEmployee_IdAndCycle_CycleId(employeeId, cycleId)
                .orElseThrow(() -> new NotFoundException("Appraisal not found for employee in this cycle"));

        // Fetch scores from sub-entities
        BigDecimal managerScore = managerEvaluationRepository.findByAppraisal_AppraisalId(appraisal.getAppraisalId())
                .map(ManagerEvaluation::getTotalScore).orElse(BigDecimal.ZERO);
        
        BigDecimal selfScore = selfAssessmentRepository.findByAppraisal_AppraisalId(appraisal.getAppraisalId())
                .map(SelfAssessment::getTotalScore).orElse(BigDecimal.ZERO);

        BigDecimal feedbackScore = feedbackSummaryRepository.findByEmployeeIdAndCycleCycleId(employeeId, cycleId)
                .map(FeedbackSummary::getFinalScore).orElse(BigDecimal.ZERO);

        // Fetch Weights
        ScoringWeight weights = weightRepository.findByCycle_CycleId(cycleId)
                .orElseGet(() -> {
                    ScoringWeight w = new ScoringWeight();
                    w.setSelfWeight(new BigDecimal("0.2"));
                    w.setManagerWeight(new BigDecimal("0.5"));
                    w.setFeedbackWeight(new BigDecimal("0.3"));
                    return w;
                });

        // Calculate Weighted Total
        BigDecimal totalScore = managerScore.multiply(weights.getManagerWeight())
                .add(selfScore.multiply(weights.getSelfWeight()))
                .add(feedbackScore.multiply(weights.getFeedbackWeight()));

        totalScore = totalScore.setScale(2, RoundingMode.HALF_UP);

        // Save Summary
        AppraisalSummary summary = summaryRepository.findByEmployee_IdAndCycle_CycleId(employeeId, cycleId)
                .orElseGet(() -> {
                    AppraisalSummary newSummary = new AppraisalSummary();
                    newSummary.setEmployee(employee);
                    newSummary.setCycle(cycle);
                    return newSummary;
                });

        summary.setTotalScore(totalScore);
        summary.setFinalGrade(determineGrade(totalScore));

        summaryRepository.save(summary);
    }

    private PerformanceGrade determineGrade(BigDecimal score) {
        if (score.compareTo(new BigDecimal("4.5")) >= 0) return PerformanceGrade.OUTSTANDING;
        if (score.compareTo(new BigDecimal("3.5")) >= 0) return PerformanceGrade.EXCEEDS_EXPECTATIONS;
        if (score.compareTo(new BigDecimal("2.5")) >= 0) return PerformanceGrade.MEETS_EXPECTATIONS;
        if (score.compareTo(new BigDecimal("1.5")) >= 0) return PerformanceGrade.NEEDS_IMPROVEMENT;
        return PerformanceGrade.UNSATISFACTORY;
    }

    @Override
    public AppraisalSummaryResponse getFinalResult(Long employeeId, Long cycleId) {
        AppraisalSummary summary = summaryRepository.findByEmployee_IdAndCycle_CycleId(employeeId, cycleId)
                .orElseThrow(() -> new NotFoundException("Summary not found"));

        return summaryMapper.toResponse(summary);
    }
}
