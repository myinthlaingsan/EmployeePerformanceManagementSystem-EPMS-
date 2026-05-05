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
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.AppraisalCycleRepository;
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
    private final ace.org.epms_backend.repository.feedback360.FeedbackSummaryRepository feedbackSummaryRepository;

    @Override
    public FeedbackSummaryResponse getFeedbackSummary(Long targetUserId, Long cycleId) {
        Employee target = employeeRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        AppraisalCycle cycle = appraisalCycleRepository.findById(cycleId)
                .orElseThrow(() -> new RuntimeException("Appraisal cycle not found"));

        List<Feedback> allFeedbacks = feedbackRepository.findByRequestTargetUserIdAndRequestCycleCycleId(targetUserId, cycleId);

        Map<String, List<Integer>> selfScoresMap = new HashMap<>();
        Map<String, List<Integer>> othersScoresMap = new HashMap<>();
        List<DetailedComment> detailedComments = new ArrayList<>();
        int totalOthersPoints = 0;
        int totalOthersQuestions = 0;

        for (Feedback feedback : allFeedbacks) {
            List<FeedbackResponse> responses = feedbackResponseRepository.findByFeedbackId(feedback.getId());
            FeedbackRelationship relationship = feedback.getRequest().getRelationship();
            
            String evaluatorName;
            if (relationship == FeedbackRelationship.PEER || relationship == FeedbackRelationship.SUBORDINATE) {
                evaluatorName = "Anonymous " + relationship.name();
            } else {
                evaluatorName = feedback.getRequest().getEvaluator().getStaffName();
            }

            for (FeedbackResponse response : responses) {
                String categoryName = response.getQuestion().getCategory() != null ? 
                                      response.getQuestion().getCategory().getCategoryName() : "General";
                
                Integer score = response.getScore();
                
                if (relationship == FeedbackRelationship.SELF) {
                    selfScoresMap.computeIfAbsent(categoryName, k -> new ArrayList<>()).add(score);
                } else {
                    othersScoresMap.computeIfAbsent(categoryName, k -> new ArrayList<>()).add(score);
                    totalOthersPoints += score;
                    totalOthersQuestions++;
                }

                if (response.getComment() != null && !response.getComment().isBlank()) {
                    detailedComments.add(DetailedComment.builder()
                            .categoryName(categoryName)
                            .evaluatorRole(relationship.name())
                            .evaluatorName(evaluatorName)
                            .comment(response.getComment())
                            .score(score)
                            .build());
                }
            }
        }

        double totalAverageScore = totalOthersQuestions > 0 ? 
                                   (totalOthersPoints / (double) (totalOthersQuestions * 5)) * 100.0 : 0.0;

        FeedbackSummary summary = feedbackSummaryRepository.findByEmployeeIdAndCycleCycleId(targetUserId, cycleId)
                .orElse(null);

        Long summaryId = summary != null ? summary.getId() : null;
        Boolean isFinalized = summary != null ? summary.getIsFinalized() : false;

        return FeedbackSummaryResponse.builder()
                .summaryId(summaryId)
                .targetUserId(targetUserId)
                .targetUserName(target.getStaffName())
                .cycleName(cycle.getCycleName())
                .selfScores(calculateAverages(selfScoresMap))
                .scores(calculateAverages(othersScoresMap))
                .detailedComments(detailedComments)
                .totalAverageScore(Math.round(totalAverageScore * 100.0) / 100.0)
                .isFinalized(isFinalized)
                .build();
    }

    private List<CategoryScore> calculateAverages(Map<String, List<Integer>> scoresMap) {
        return scoresMap.entrySet().stream()
                .map(entry -> {
                    List<Integer> scores = entry.getValue();
                    int totalPoints = scores.stream().mapToInt(Integer::intValue).sum();
                    int questionCount = scores.size();
                    
                    // Formula from image: (Total Point / (Number of Questions Answered * 5)) * 100
                    double percentageScore = (totalPoints / (double) (questionCount * 5)) * 100.0;
                    
                    return new CategoryScore(entry.getKey(), Math.round(percentageScore * 100.0) / 100.0);
                })
                .collect(Collectors.toList());
    }
}
