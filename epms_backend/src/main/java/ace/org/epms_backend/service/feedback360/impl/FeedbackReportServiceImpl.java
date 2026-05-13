package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.feedback360.CategoryScore;
import ace.org.epms_backend.dto.feedback360.FeedbackSummaryResponse;
import ace.org.epms_backend.dto.feedback360.DetailedComment;
import ace.org.epms_backend.dto.feedback360.QuestionRatingReport;
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
import ace.org.epms_backend.repository.feedback360.FeedbackSummaryRepository;
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
    private final FeedbackSummaryRepository feedbackSummaryRepository;
    private final ace.org.epms_backend.repository.feedback360.FeedbackRequestRepository feedbackRequestRepository;
    private final ace.org.epms_backend.repository.EmployeeDepartmentRepository employeeDepartmentRepository;

    @Override
    public FeedbackSummaryResponse getFeedbackSummary(Long targetUserId, Long cycleId) {
        Employee target = employeeRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        AppraisalCycle cycle = appraisalCycleRepository.findById(cycleId)
                .orElseThrow(() -> new RuntimeException("Appraisal cycle not found"));

        List<Feedback> allFeedbacks = feedbackRepository.findByRequestTargetUserIdAndRequestCycleCycleId(targetUserId,
                cycleId);

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
                String categoryName = response.getQuestion().getCategory() != null
                        ? response.getQuestion().getCategory().getCategoryName()
                        : "General";

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
                            .comment(response.getComment())
                            .score(score)
                            .evaluatorName(evaluatorName)
                            .evaluatorRole(relationship.name())
                            .build());
                }
            }

            if (feedback.getOverallComment() != null && !feedback.getOverallComment().isBlank()) {
                detailedComments.add(DetailedComment.builder()
                        .categoryName("Overall Summary")
                        .evaluatorRole(relationship.name())
                        .evaluatorName(evaluatorName)
                        .comment(feedback.getOverallComment())
                        .score(0)
                        .build());
            }
        }

        double totalAverageScore = totalOthersQuestions > 0
                ? (totalOthersPoints / (double) (totalOthersQuestions * 5)) * 100.0
                : 0.0;

        FeedbackSummary summary = feedbackSummaryRepository.findByEmployeeIdAndCycleCycleId(targetUserId, cycleId)
                .orElse(null);

        Long summaryId = summary != null ? summary.getId() : null;
        Boolean isFinalized = summary != null ? summary.getIsFinalized() : false;

        // Fetch metrics
        int totalRequests = (int) feedbackRequestRepository.countByTargetUserIdAndCycleCycleId(targetUserId, cycleId);
        int completedRequests = (int) feedbackRequestRepository.countByTargetUserIdAndCycleCycleIdAndStatus(targetUserId, cycleId, ace.org.epms_backend.enums.FeedbackStatus.COMPLETED);

        String deptName = employeeDepartmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(targetUserId)
                .map(ed -> ed.getCurrentDepartment() != null ? ed.getCurrentDepartment().getDepartmentName() : "N/A")
                .orElse("N/A");

        // Calculate question-level averages (excluding SELF)
        Map<String, List<Integer>> questionScoresMap = new HashMap<>();
        Map<String, String> questionToCategoryMap = new HashMap<>();
        
        for (Feedback feedback : allFeedbacks) {
            if (feedback.getRequest().getRelationship() == FeedbackRelationship.SELF) continue;
            
            List<FeedbackResponse> responses = feedbackResponseRepository.findByFeedbackId(feedback.getId());
            for (FeedbackResponse response : responses) {
                String qText = response.getQuestion().getQuestionText();
                String catName = response.getQuestion().getCategory() != null 
                        ? response.getQuestion().getCategory().getCategoryName() 
                        : "General";
                
                questionScoresMap.computeIfAbsent(qText, k -> new ArrayList<>()).add(response.getScore());
                questionToCategoryMap.put(qText, catName);
            }
        }

        List<QuestionRatingReport> questionRatings = questionScoresMap.entrySet().stream()
                .map(entry -> {
                    String qText = entry.getKey();
                    List<Integer> scores = entry.getValue();
                    double avg = scores.stream().mapToInt(Integer::intValue).average().orElse(0.0);
                    // Convert to 100% scale (assuming 1-5 rating)
                    double percentage = (avg / 5.0) * 100.0;
                    
                    return QuestionRatingReport.builder()
                            .questionText(qText)
                            .categoryName(questionToCategoryMap.get(qText))
                            .averageScore(Math.round(percentage * 100.0) / 100.0)
                            .responseCount(scores.size())
                            .build();
                })
                .collect(Collectors.toList());

        return FeedbackSummaryResponse.builder()
                .summaryId(summaryId)
                .targetUserId(targetUserId)
                .targetUserName(target.getStaffName())
                .targetDepartmentName(deptName)
                .targetJobLevelCode(target.getLevel() != null ? target.getLevel().getLevelCode() : "N/A")
                .totalRequests(totalRequests)
                .completedRequests(completedRequests)
                .questionRatings(questionRatings)
                .cycleId(cycleId)
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
