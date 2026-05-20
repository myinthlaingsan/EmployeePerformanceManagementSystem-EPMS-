package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.feedback360.FeedbackSummaryResponse;
import ace.org.epms_backend.dto.feedback360.ManagerReviewRequest;
import ace.org.epms_backend.enums.FeedbackRelationship;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.feedback360.Feedback;
import ace.org.epms_backend.model.feedback360.FeedbackSummary;
import ace.org.epms_backend.model.feedback360.ScoringPolicy;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.AppraisalCycleRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackSummaryRepository;
import ace.org.epms_backend.repository.feedback360.ScoringPolicyRepository;
import ace.org.epms_backend.service.feedback360.FeedbackReportService;
import ace.org.epms_backend.service.feedback360.FeedbackSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import static ace.org.epms_backend.enums.FeedbackRelationship.*;

@Service
@RequiredArgsConstructor
public class FeedbackSummaryServiceImpl implements FeedbackSummaryService {

    private final FeedbackRepository feedbackRepository;
    private final FeedbackSummaryRepository summaryRepository;
    private final EmployeeRepository employeeRepository;
    private final AppraisalCycleRepository cycleRepository;
    private final FeedbackReportService feedbackReportService;
    private final ScoringPolicyRepository scoringPolicyRepository;

    @Override
    @Transactional
    public void generateSummary(Long employeeId, Long cycleId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Employee not found"));
        AppraisalCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new NotFoundException("Cycle not found"));

        List<Feedback> feedbacks = feedbackRepository
                .findByRequestTargetUserIdAndRequestCycleCycleId(employeeId, cycleId);

        Map<FeedbackRelationship, List<Feedback>> grouped = feedbacks.stream()
                .collect(Collectors.groupingBy(Feedback::getRelationship));

        BigDecimal managerScore     = averageOrNull(grouped.get(DIRECT_MANAGER));
        BigDecimal peerScore        = averageOrNull(grouped.get(PEER));
        BigDecimal subordinateScore = averageOrNull(grouped.get(SUBORDINATE));
        BigDecimal selfScore        = averageOrNull(grouped.get(SELF));

        // Resolve scoring policy; fall back to cycle default, then to hardcoded defaults
        Optional<ScoringPolicy> levelPolicy = (employee.getLevel() != null)
                ? scoringPolicyRepository.findByCycleAndJobLevel(cycle, employee.getLevel())
                : Optional.empty();
        Optional<ScoringPolicy> cycleDefault = scoringPolicyRepository.findCycleDefault(cycle);

        // Default weights: Manager 50%, Peer 30%, Subordinate 20%, Self excluded
        BigDecimal wMgr  = levelPolicy.map(ScoringPolicy::getManagerWeight)
                .orElseGet(() -> cycleDefault.map(ScoringPolicy::getManagerWeight)
                        .orElse(new BigDecimal("0.50")));
        BigDecimal wPeer = levelPolicy.map(ScoringPolicy::getPeerWeight)
                .orElseGet(() -> cycleDefault.map(ScoringPolicy::getPeerWeight)
                        .orElse(new BigDecimal("0.30")));
        BigDecimal wSub  = levelPolicy.map(ScoringPolicy::getSubordinateWeight)
                .orElseGet(() -> cycleDefault.map(ScoringPolicy::getSubordinateWeight)
                        .orElse(new BigDecimal("0.20")));
        BigDecimal wSelf = levelPolicy.map(ScoringPolicy::getSelfWeight)
                .orElseGet(() -> cycleDefault.map(ScoringPolicy::getSelfWeight)
                        .orElse(BigDecimal.ZERO));
        boolean includeSelf = levelPolicy.map(p -> Boolean.TRUE.equals(p.getIncludeSelfInFinal()))
                .orElseGet(() -> cycleDefault.map(p -> Boolean.TRUE.equals(p.getIncludeSelfInFinal()))
                        .orElse(false));

        // Build weight map for present groups only — missing groups do NOT deflate the score
        Map<FeedbackRelationship, BigDecimal> scores  = new EnumMap<>(FeedbackRelationship.class);
        Map<FeedbackRelationship, BigDecimal> weights = new EnumMap<>(FeedbackRelationship.class);
        if (managerScore     != null) { scores.put(DIRECT_MANAGER, managerScore);     weights.put(DIRECT_MANAGER, wMgr); }
        if (peerScore        != null) { scores.put(PEER, peerScore);                  weights.put(PEER, wPeer); }
        if (subordinateScore != null) { scores.put(SUBORDINATE, subordinateScore);    weights.put(SUBORDINATE, wSub); }
        if (selfScore != null && includeSelf) {
            scores.put(SELF, selfScore);
            weights.put(SELF, wSelf);
        }

        BigDecimal totalWeight = weights.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Renormalize: divide weighted sum by sum-of-present-weights
        BigDecimal finalScore = totalWeight.signum() == 0
                ? null
                : scores.entrySet().stream()
                        .map(e -> e.getValue().multiply(weights.get(e.getKey())))
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(totalWeight, 2, RoundingMode.HALF_UP);

        FeedbackSummary summary = summaryRepository
                .findByEmployeeIdAndCycleCycleId(employeeId, cycleId)
                .orElse(new FeedbackSummary());
        summary.setEmployee(employee);
        summary.setCycle(cycle);
        summary.setManagerScore(managerScore);
        summary.setPeerScore(peerScore);
        summary.setSubordinateScore(subordinateScore);
        summary.setSelfScore(selfScore);
        summary.setFinalScore(finalScore);
        summary.setTotalEvaluators(feedbacks.size());
        summary.setIsFinalized(false);
        summaryRepository.save(summary);
    }

    private BigDecimal averageOrNull(List<Feedback> feedbacks) {
        if (feedbacks == null || feedbacks.isEmpty()) return null;
        List<BigDecimal> valid = feedbacks.stream()
                .map(Feedback::getAverageScore)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        if (valid.isEmpty()) return null;
        BigDecimal total = valid.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.divide(BigDecimal.valueOf(valid.size()), 2, RoundingMode.HALF_UP);
    }

    @Override
    @Transactional
    public void generateAllSummaries(Long cycleId) {
        // Only process employees who actually have feedback in this cycle
        List<Long> targetIds = feedbackRepository.findDistinctTargetUserIdsByCycle(cycleId);
        for (Long id : targetIds) {
            generateSummary(id, cycleId);
        }
    }

    @Override
    public FeedbackSummaryResponse getSummary(Long employeeId, Long cycleId) {
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

    @Override
    @Transactional
    public void addManagerReview(Long summaryId, ManagerReviewRequest request, Long callerId) {
        FeedbackSummary summary = summaryRepository.findById(summaryId)
                .orElseThrow(() -> new NotFoundException("Summary not found: " + summaryId));
        summary.setManagerSummary(request.getManagerSummary());
        if (request.getCalibratedFinalScore() != null) {
            summary.setCalibratedFinalScore(request.getCalibratedFinalScore());
            summary.setFinalizedAt(java.time.Instant.now());
            summary.setFinalizedBy(callerId);
        }
        summaryRepository.save(summary);
    }
}
