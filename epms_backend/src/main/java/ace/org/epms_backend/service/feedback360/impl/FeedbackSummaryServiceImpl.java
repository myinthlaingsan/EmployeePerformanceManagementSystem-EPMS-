package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.feedback360.FeedbackSummaryResponse;
import ace.org.epms_backend.enums.FeedbackRelationship;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.FeedbackMapper;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.feedback360.Feedback;
import ace.org.epms_backend.model.feedback360.FeedbackSummary;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.AppraisalCycleRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackSummaryRepository;
import ace.org.epms_backend.service.feedback360.FeedbackSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackSummaryServiceImpl implements FeedbackSummaryService {

    private final FeedbackRepository feedbackRepository;
    private final FeedbackSummaryRepository summaryRepository;
    private final EmployeeRepository employeeRepository;
    private final AppraisalCycleRepository cycleRepository;
    private final FeedbackMapper feedbackMapper;
    private final ace.org.epms_backend.service.feedback360.FeedbackReportService feedbackReportService;

    @Override
    @Transactional
    public void generateSummary(Long employeeId, Long cycleId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Employee not found"));
        AppraisalCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new NotFoundException("Cycle not found"));

        List<Feedback> feedbacks = feedbackRepository.findByRequestTargetUserIdAndRequestCycleCycleId(employeeId, cycleId);
        
        Map<FeedbackRelationship, List<Feedback>> grouped = feedbacks.stream()
                .collect(Collectors.groupingBy(Feedback::getRelationship));

        BigDecimal managerScore = calculateGroupAverage(grouped.get(FeedbackRelationship.MANAGER));
        BigDecimal peerScore = calculateGroupAverage(grouped.get(FeedbackRelationship.PEER));
        BigDecimal subScore = calculateGroupAverage(grouped.get(FeedbackRelationship.SUBORDINATE));
        BigDecimal selfScore = calculateGroupAverage(grouped.get(FeedbackRelationship.SELF));

        // Weighted Calculation
        BigDecimal finalScore = BigDecimal.ZERO;
        finalScore = finalScore.add(managerScore.multiply(new BigDecimal("0.4")));
        finalScore = finalScore.add(peerScore.multiply(new BigDecimal("0.3")));
        finalScore = finalScore.add(subScore.multiply(new BigDecimal("0.2")));
        finalScore = finalScore.add(selfScore.multiply(new BigDecimal("0.1")));

        FeedbackSummary summary = summaryRepository.findByEmployeeIdAndCycleCycleId(employeeId, cycleId)
                .orElse(new FeedbackSummary());

        summary.setEmployee(employee);
        summary.setCycle(cycle);
        summary.setManagerScore(managerScore);
        summary.setPeerScore(peerScore);
        summary.setSubordinateScore(subScore);
        summary.setSelfScore(selfScore);
        summary.setFinalScore(finalScore.setScale(2, RoundingMode.HALF_UP));
        summary.setTotalEvaluators(feedbacks.size());
        summary.setIsFinalized(false);

        summaryRepository.save(summary);
    }

    private BigDecimal calculateGroupAverage(List<Feedback> feedbacks) {
        if (feedbacks == null || feedbacks.isEmpty()) return BigDecimal.ZERO;
        
        BigDecimal total = feedbacks.stream()
                .map(Feedback::getAverageScore)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return total.divide(BigDecimal.valueOf(feedbacks.size()), 2, RoundingMode.HALF_UP);
    }

    @Override
    @Transactional
    public void generateAllSummaries(Long cycleId) {
        List<Employee> employees = employeeRepository.findAll();
        for (Employee e : employees) {
            generateSummary(e.getId(), cycleId);
        }
    }

    @Override
    public FeedbackSummaryResponse getSummary(Long employeeId, Long cycleId) {
        // Return full detailed report using FeedbackReportService
        return feedbackReportService.getFeedbackSummary(employeeId, cycleId);
    }

    @Override
    public List<FeedbackSummaryResponse> getSummariesByCycle(Long cycleId) {
        return summaryRepository.findByCycleCycleId(cycleId).stream()
                .map(s -> feedbackReportService.getFeedbackSummary(s.getEmployee().getId(), cycleId))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void finalizeSummary(Long summaryId) {
        FeedbackSummary summary = summaryRepository.findById(summaryId)
                .orElseThrow(() -> new NotFoundException("Summary not found"));
        summary.setIsFinalized(true);
        summaryRepository.save(summary);
    }
}
