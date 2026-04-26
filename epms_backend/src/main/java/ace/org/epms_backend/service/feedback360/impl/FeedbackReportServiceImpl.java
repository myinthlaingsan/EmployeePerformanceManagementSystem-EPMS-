package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.feedback360.CategoryScore;
import ace.org.epms_backend.dto.feedback360.FeedbackSummaryResponse;
import ace.org.epms_backend.enums.FeedbackRelationship;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.feedback360.Feedback;
import ace.org.epms_backend.model.feedback360.FeedbackResponse;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.appraisal.AppraisalCycleRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackResponseRepository;
import ace.org.epms_backend.service.feedback360.FeedbackReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackReportServiceImpl implements FeedbackReportService {

    private final FeedbackRepository feedbackRepository;
    private final FeedbackResponseRepository feedbackResponseRepository;
    private final EmployeeRepository employeeRepository;
    private final AppraisalCycleRepository appraisalCycleRepository;

    @Override
    public FeedbackSummaryResponse getFeedbackSummary(Long targetUserId, Long cycleId) {
        Employee target = employeeRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        AppraisalCycle cycle = appraisalCycleRepository.findById(cycleId)
                .orElseThrow(() -> new RuntimeException("Appraisal cycle not found"));

        List<Feedback> allFeedbacks = feedbackRepository.findByRequestTargetUserIdAndRequestCycleCycleId(targetUserId, cycleId);

        Map<String, List<Integer>> selfScoresMap = new HashMap<>();
        Map<String, List<Integer>> othersScoresMap = new HashMap<>();
        List<FeedbackSummaryResponse.DetailedComment> detailedComments = new ArrayList<>();

        for (Feedback feedback : allFeedbacks) {
            List<FeedbackResponse> responses = feedbackResponseRepository.findByFeedbackId(feedback.getId());
            FeedbackRelationship relationship = feedback.getRequest().getRelationship();
            boolean isAnonymous = feedback.getRequest().getIsAnonymous();
            String evaluatorName = isAnonymous ? "Anonymous " + relationship.name() : feedback.getRequest().getEvaluator().getStaffName();

            for (FeedbackResponse response : responses) {
                String categoryName = response.getQuestion().getCategory() != null ? 
                                      response.getQuestion().getCategory().getCategoryName() : "General";
                
                Integer score = response.getScore();
                
                if (relationship == FeedbackRelationship.SELF) {
                    selfScoresMap.computeIfAbsent(categoryName, k -> new ArrayList<>()).add(score);
                } else {
                    othersScoresMap.computeIfAbsent(categoryName, k -> new ArrayList<>()).add(score);
                }

                if (response.getComment() != null && !response.getComment().isBlank()) {
                    detailedComments.add(FeedbackSummaryResponse.DetailedComment.builder()
                            .categoryName(categoryName)
                            .evaluatorRole(relationship.name())
                            .evaluatorName(evaluatorName)
                            .comment(response.getComment())
                            .score(score)
                            .build());
                }
            }
        }

        return FeedbackSummaryResponse.builder()
                .targetUserId(targetUserId)
                .targetUserName(target.getStaffName())
                .cycleName(cycle.getCycleName())
                .selfScores(calculateAverages(selfScoresMap))
                .othersScores(calculateAverages(othersScoresMap))
                .detailedComments(detailedComments)
                .build();
    }

    private List<CategoryScore> calculateAverages(Map<String, List<Integer>> scoresMap) {
        return scoresMap.entrySet().stream()
                .map(entry -> {
                    double avg = entry.getValue().stream()
                            .mapToInt(Integer::intValue)
                            .average()
                            .orElse(0.0);
                    return new CategoryScore(entry.getKey(), Math.round(avg * 100.0) / 100.0);
                })
                .collect(Collectors.toList());
    }
}
