package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.feedback360.CategoryScore;
import ace.org.epms_backend.dto.feedback360.FeedbackSummaryResponse;
import ace.org.epms_backend.dto.feedback360.DetailedComment;
import ace.org.epms_backend.dto.feedback360.PooledFeedbackSection;
import ace.org.epms_backend.enums.FeedbackRelationship;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.feedback360.Feedback;
import ace.org.epms_backend.model.feedback360.FeedbackResponse;
import ace.org.epms_backend.model.feedback360.FeedbackSummary;
import ace.org.epms_backend.model.feedback360.ScoringPolicy;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.AppraisalCycleRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackResponseRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackSummaryRepository;
import ace.org.epms_backend.repository.feedback360.ScoringPolicyRepository;
import ace.org.epms_backend.dto.feedback360.Feedback360BottleneckDTO;
import ace.org.epms_backend.dto.feedback360.Feedback360CycleDashboardDTO;
import ace.org.epms_backend.enums.FeedbackStatus;
import ace.org.epms_backend.model.employee.EmployeeDepartment;
import ace.org.epms_backend.model.feedback360.FeedbackRequest;
import ace.org.epms_backend.repository.EmployeeDepartmentRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackRequestRepository;
import ace.org.epms_backend.service.feedback360.FeedbackReportService;
import ace.org.epms_backend.service.feedback360.SecurityHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackReportServiceImpl implements FeedbackReportService {

    private static final int DEFAULT_SUPPRESSION_THRESHOLD = 3;

    private final FeedbackRepository feedbackRepository;
    private final FeedbackResponseRepository feedbackResponseRepository;
    private final EmployeeRepository employeeRepository;
    private final AppraisalCycleRepository appraisalCycleRepository;
    private final FeedbackSummaryRepository feedbackSummaryRepository;
    private final ScoringPolicyRepository scoringPolicyRepository;
    private final FeedbackRequestRepository feedbackRequestRepository;
    private final EmployeeDepartmentRepository employeeDepartmentRepository;
    private final SecurityHelper securityHelper;

    @Override
    public FeedbackSummaryResponse getFeedbackSummary(Long targetUserId, Long cycleId) {
        Employee target = employeeRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        AppraisalCycle cycle = appraisalCycleRepository.findById(cycleId)
                .orElseThrow(() -> new RuntimeException("Appraisal cycle not found"));

        List<Feedback> allFeedbacks = feedbackRepository
                .findByRequestTargetUserIdAndRequestCycleCycleId(targetUserId, cycleId);

        // Suppression threshold from policy; fallback to 3
        int suppressionThreshold = scoringPolicyRepository.findCycleDefault(cycle)
                .map(ScoringPolicy::getSuppressionThreshold)
                .filter(Objects::nonNull)
                .orElse(DEFAULT_SUPPRESSION_THRESHOLD);

        // Count feedbacks per relationship for comment suppression
        Map<FeedbackRelationship, Long> countByRelationship = allFeedbacks.stream()
                .collect(Collectors.groupingBy(
                        f -> f.getRequest().getRelationship(),
                        Collectors.counting()));

        Map<String, List<Integer>> selfScoresMap = new HashMap<>();
        Map<String, List<Integer>> managerScoresMap = new HashMap<>();
        Map<String, List<Integer>> peerScoresMap = new HashMap<>();
        Map<String, List<Integer>> subordinateScoresMap = new HashMap<>();
        Map<String, List<Integer>> othersScoresMap = new HashMap<>();

        List<DetailedComment> allComments = new ArrayList<>();
        int totalOthersPoints = 0;
        int totalOthersQuestions = 0;

        for (Feedback feedback : allFeedbacks) {
            List<FeedbackResponse> responses = feedbackResponseRepository
                    .findByFeedbackId(feedback.getId());
            FeedbackRelationship relationship = feedback.getRequest().getRelationship();

            // Mask evaluator identity when the viewer is the target (peer/subordinate anonymous rows).
            // HR viewing someone else's report sees real names for audit purposes.
            Long viewerId = securityHelper.currentUserId();
            boolean viewerIsTarget = viewerId != null && viewerId.equals(targetUserId);
            boolean anonymous = Boolean.TRUE.equals(feedback.getRequest().getIsAnonymous())
                    && relationship != FeedbackRelationship.SELF
                    && relationship != FeedbackRelationship.DIRECT_MANAGER
                    && viewerIsTarget;
            String evaluatorName = anonymous
                    ? "Anonymous"
                    : feedback.getRequest().getEvaluator().getStaffName();

            for (FeedbackResponse response : responses) {
                String categoryName = response.getQuestion().getCategory() != null
                        ? response.getQuestion().getCategory().getCategoryName()
                        : "General";

                Integer score = response.getScore();
                if (score != null) {
                    switch (relationship) {
                        case SELF -> selfScoresMap
                                .computeIfAbsent(categoryName, k -> new ArrayList<>())
                                .add(score);
                        case DIRECT_MANAGER -> {
                            managerScoresMap.computeIfAbsent(categoryName,
                                    k -> new ArrayList<>()).add(score);
                            othersScoresMap.computeIfAbsent(categoryName,
                                    k -> new ArrayList<>()).add(score);
                            totalOthersPoints += score;
                            totalOthersQuestions++;
                        }
                        case PEER -> {
                            peerScoresMap.computeIfAbsent(categoryName,
                                    k -> new ArrayList<>()).add(score);
                            othersScoresMap.computeIfAbsent(categoryName,
                                    k -> new ArrayList<>()).add(score);
                            totalOthersPoints += score;
                            totalOthersQuestions++;
                        }
                        case SUBORDINATE -> {
                            subordinateScoresMap
                                    .computeIfAbsent(categoryName,
                                            k -> new ArrayList<>())
                                    .add(score);
                            othersScoresMap.computeIfAbsent(categoryName,
                                    k -> new ArrayList<>()).add(score);
                            totalOthersPoints += score;
                            totalOthersQuestions++;
                        }
                    }
                }

                if (response.getComment() != null && !response.getComment().isBlank()) {
                    allComments.add(DetailedComment.builder()
                            .categoryName(categoryName)
                            .evaluatorRole(relationship.name())
                            .evaluatorName(evaluatorName)
                            .comment(response.getComment())
                            .score(score)
                            .build());
                }
            }
        }

        // Suppress comments from groups below the threshold and shuffle to prevent
        // order-based identity leak
        List<DetailedComment> visibleComments = allComments.stream()
                .filter(c -> {
                    FeedbackRelationship rel;
                    try {
                        rel = FeedbackRelationship.valueOf(c.getEvaluatorRole());
                    } catch (IllegalArgumentException e) {
                        return true;
                    }
                    long count = countByRelationship.getOrDefault(rel, 0L);
                    return rel == FeedbackRelationship.SELF
                            || rel == FeedbackRelationship.DIRECT_MANAGER
                            || count >= suppressionThreshold;
                })
                .collect(Collectors.toList());
        Collections.shuffle(visibleComments);

        FeedbackSummary summary = feedbackSummaryRepository
                .findByEmployeeIdAndCycleCycleId(targetUserId, cycleId).orElse(null);

        double totalAverageScore;
        if (summary != null) {
            BigDecimal fs = summary.getCalibratedFinalScore() != null
                    ? summary.getCalibratedFinalScore()
                    : summary.getFinalScore();
            totalAverageScore = fs != null ? fs.doubleValue() : 0.0;
        } else {
            totalAverageScore = totalOthersQuestions > 0
                    ? (totalOthersPoints / (double) (totalOthersQuestions * 5)) * 100.0
                    : 0.0;
        }

        PooledFeedbackSection peerPool = buildPool(allFeedbacks, FeedbackRelationship.PEER, suppressionThreshold);
        PooledFeedbackSection subPool = buildPool(allFeedbacks, FeedbackRelationship.SUBORDINATE, suppressionThreshold);

        return FeedbackSummaryResponse.builder()
                .summaryId(summary != null ? summary.getId() : null)
                .targetUserId(targetUserId)
                .targetUserName(target.getStaffName())
                .cycleName(cycle.getCycleName())
                .selfScores(calculateAverages(selfScoresMap))
                .managerScores(calculateAverages(managerScoresMap))
                .peerScores(calculateAverages(peerScoresMap))
                .subordinateScores(calculateAverages(subordinateScoresMap))
                .scores(calculateAverages(othersScoresMap))
                .detailedComments(visibleComments)
                .totalAverageScore(Math.round(totalAverageScore * 100.0) / 100.0)
                .isFinalized(summary != null ? summary.getIsFinalized() : false)
                .managerSummary(summary != null ? summary.getManagerSummary() : null)
                .calibratedFinalScore(summary != null ? summary.getCalibratedFinalScore() : null)
                .calibrationStatus(summary != null ? summary.getCalibrationStatus() : null)
                .calibrationReason(summary != null ? summary.getCalibrationReason() : null)
                .calibrationDate(summary != null ? summary.getCalibrationDate() : null)
                .calibratedBy(summary != null ? summary.getCalibratedBy() : null)
                .finalizedAt(summary != null ? summary.getFinalizedAt() : null)
                .finalizedBy(summary != null ? summary.getFinalizedBy() : null)
                .pooledPeerFeedback(peerPool)
                .pooledSubordinateFeedback(subPool)
                .suppressionThreshold(suppressionThreshold)
                .build();
    }

    private List<CategoryScore> calculateAverages(Map<String, List<Integer>> scoresMap) {
        return scoresMap.entrySet().stream()
                .map(entry -> {
                    List<Integer> scores = entry.getValue();
                    int totalPoints = scores.stream().mapToInt(Integer::intValue).sum();
                    int questionCount = scores.size();
                    double pct = (totalPoints / (double) (questionCount * 5)) * 100.0;
                    return new CategoryScore(entry.getKey(), Math.round(pct * 100.0) / 100.0);
                })
                .collect(Collectors.toList());
    }

    private PooledFeedbackSection buildPool(List<Feedback> all, FeedbackRelationship rel, int threshold) {
        List<Feedback> group = all.stream()
                .filter(f -> f.getRelationship() == rel)
                .collect(Collectors.toList());
        int count = group.size();
        if (count < threshold) {
            return PooledFeedbackSection.builder()
                    .submissionCount(count)
                    .suppressed(true)
                    .suppressionMessage(
                            "Suppressed — fewer than " + threshold + " submissions to protect anonymity")
                    .build();
        }
        Map<String, List<Integer>> categoryScoresMap = new HashMap<>();
        List<String> comments = new ArrayList<>();
        for (Feedback feedback : group) {
            for (FeedbackResponse response : feedbackResponseRepository.findByFeedbackId(feedback.getId())) {
                String categoryName = response.getQuestion().getCategory() != null
                        ? response.getQuestion().getCategory().getCategoryName()
                        : "General";
                if (response.getScore() != null) {
                    categoryScoresMap.computeIfAbsent(categoryName, k -> new ArrayList<>())
                            .add(response.getScore());
                }
                if (response.getComment() != null && !response.getComment().isBlank()) {
                    comments.add(response.getComment());
                }
            }
        }
        Collections.shuffle(comments);
        return PooledFeedbackSection.builder()
                .submissionCount(count)
                .averages(calculateAverages(categoryScoresMap))
                .shuffledComments(comments)
                .suppressed(false)
                .build();
    }

    @Override
    public Feedback360CycleDashboardDTO getCycleDashboard(Long cycleId) {
        AppraisalCycle cycle = appraisalCycleRepository.findById(cycleId)
                .orElseThrow(() -> new RuntimeException("Appraisal cycle not found"));

        List<FeedbackRequest> requests = feedbackRequestRepository.findByCycleCycleId(cycleId);

        long totalTargets = requests.stream().map(r -> r.getTargetUser().getId()).distinct().count();
        long totalRequests = requests.size();

        long submittedRequests = 0;
        long pendingRequests = 0;
        long overdueRequests = 0;
        long cancelledRequests = 0;

        Instant now = Instant.now();
        Map<String, long[]> relationshipStats = new HashMap<>(); // [total, submitted]

        Map<Long, Long> evaluatorPendingCounts = new HashMap<>();
        Map<Long, Employee> evaluatorMap = new HashMap<>();

        for (FeedbackRequest r : requests) {
            String rel = r.getRelationship().name();
            relationshipStats.putIfAbsent(rel, new long[]{0, 0});
            relationshipStats.get(rel)[0]++;

            if (r.getStatus() == FeedbackStatus.COMPLETED) {
                submittedRequests++;
                relationshipStats.get(rel)[1]++;
            } else if (r.getStatus() == FeedbackStatus.CANCELLED) {
                cancelledRequests++;
            } else {
                if (r.getDueDate() != null && r.getDueDate().isBefore(now)) {
                    overdueRequests++;
                } else {
                    pendingRequests++;
                }

                // Bottleneck tracking
                Long evalId = r.getEvaluator().getId();
                evaluatorPendingCounts.put(evalId, evaluatorPendingCounts.getOrDefault(evalId, 0L) + 1);
                evaluatorMap.putIfAbsent(evalId, r.getEvaluator());
            }
        }

        double overallSubmissionRate = totalRequests > 0 ? (submittedRequests / (double) totalRequests) * 100.0 : 0.0;
        
        Map<String, Double> relationshipRates = new HashMap<>();
        for (Map.Entry<String, long[]> entry : relationshipStats.entrySet()) {
            long total = entry.getValue()[0];
            long submitted = entry.getValue()[1];
            double rate = total > 0 ? (submitted / (double) total) * 100.0 : 0.0;
            relationshipRates.put(entry.getKey(), Math.round(rate * 100.0) / 100.0);
        }

        List<Feedback360BottleneckDTO> bottlenecks = evaluatorPendingCounts.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> {
                    Employee eval = evaluatorMap.get(e.getKey());
                    EmployeeDepartment ed = employeeDepartmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(e.getKey()).orElse(null);
                    return Feedback360BottleneckDTO.builder()
                            .evaluatorId(eval.getId())
                            .evaluatorName(eval.getStaffName())
                            .evaluatorEmail(eval.getEmail())
                            .departmentName(ed != null && ed.getCurrentDepartment() != null ? ed.getCurrentDepartment().getDepartmentName() : "N/A")
                            .pendingCount(e.getValue())
                            .build();
                })
                .collect(Collectors.toList());

        return Feedback360CycleDashboardDTO.builder()
                .totalTargets(totalTargets)
                .totalRequests(totalRequests)
                .submittedRequests(submittedRequests)
                .pendingRequests(pendingRequests)
                .overdueRequests(overdueRequests)
                .cancelledRequests(cancelledRequests)
                .submissionRate(Math.round(overallSubmissionRate * 100.0) / 100.0)
                .relationshipRates(relationshipRates)
                .bottlenecks(bottlenecks)
                .isFinalized(cycle.getStatus() != null && cycle.getStatus().name().equals("CLOSED"))
                .build();
    }
}
