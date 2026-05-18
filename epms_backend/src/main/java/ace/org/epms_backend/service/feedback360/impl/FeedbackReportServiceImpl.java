package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.feedback360.CategoryScore;
import ace.org.epms_backend.dto.feedback360.FeedbackSummaryResponse;
import ace.org.epms_backend.dto.feedback360.DetailedComment;
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
import ace.org.epms_backend.service.feedback360.FeedbackReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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

        Map<String, List<Integer>> selfScoresMap       = new HashMap<>();
        Map<String, List<Integer>> managerScoresMap    = new HashMap<>();
        Map<String, List<Integer>> peerScoresMap       = new HashMap<>();
        Map<String, List<Integer>> subordinateScoresMap = new HashMap<>();
        Map<String, List<Integer>> othersScoresMap     = new HashMap<>();

        List<DetailedComment> allComments = new ArrayList<>();
        int totalOthersPoints    = 0;
        int totalOthersQuestions = 0;

        for (Feedback feedback : allFeedbacks) {
            List<FeedbackResponse> responses = feedbackResponseRepository.findByFeedbackId(feedback.getId());
            FeedbackRelationship relationship = feedback.getRequest().getRelationship();

            // Anonymity enforced on the read layer regardless of the isAnonymous flag value
            boolean anonymous = Boolean.TRUE.equals(feedback.getRequest().getIsAnonymous());
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
                        case SELF         -> selfScoresMap.computeIfAbsent(categoryName, k -> new ArrayList<>()).add(score);
                        case DIRECT_MANAGER -> {
                            managerScoresMap.computeIfAbsent(categoryName, k -> new ArrayList<>()).add(score);
                            othersScoresMap.computeIfAbsent(categoryName, k -> new ArrayList<>()).add(score);
                            totalOthersPoints += score;
                            totalOthersQuestions++;
                        }
                        case PEER -> {
                            peerScoresMap.computeIfAbsent(categoryName, k -> new ArrayList<>()).add(score);
                            othersScoresMap.computeIfAbsent(categoryName, k -> new ArrayList<>()).add(score);
                            totalOthersPoints += score;
                            totalOthersQuestions++;
                        }
                        case SUBORDINATE -> {
                            subordinateScoresMap.computeIfAbsent(categoryName, k -> new ArrayList<>()).add(score);
                            othersScoresMap.computeIfAbsent(categoryName, k -> new ArrayList<>()).add(score);
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

        // Suppress comments from groups below the threshold and shuffle to prevent order-based identity leak
        List<DetailedComment> visibleComments = allComments.stream()
                .filter(c -> {
                    FeedbackRelationship rel;
                    try { rel = FeedbackRelationship.valueOf(c.getEvaluatorRole()); }
                    catch (IllegalArgumentException e) { return true; }
                    long count = countByRelationship.getOrDefault(rel, 0L);
                    return rel == FeedbackRelationship.SELF
                            || rel == FeedbackRelationship.DIRECT_MANAGER
                            || count >= suppressionThreshold;
                })
                .collect(Collectors.toList());
        Collections.shuffle(visibleComments);

        double totalAverageScore = totalOthersQuestions > 0
                ? (totalOthersPoints / (double) (totalOthersQuestions * 5)) * 100.0
                : 0.0;

        FeedbackSummary summary = feedbackSummaryRepository
                .findByEmployeeIdAndCycleCycleId(targetUserId, cycleId).orElse(null);

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
                .build();
    }

    private List<CategoryScore> calculateAverages(Map<String, List<Integer>> scoresMap) {
        return scoresMap.entrySet().stream()
                .map(entry -> {
                    List<Integer> scores = entry.getValue();
                    int totalPoints   = scores.stream().mapToInt(Integer::intValue).sum();
                    int questionCount = scores.size();
                    double pct = (totalPoints / (double) (questionCount * 5)) * 100.0;
                    return new CategoryScore(entry.getKey(), Math.round(pct * 100.0) / 100.0);
                })
                .collect(Collectors.toList());
    }
}
