package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.feedback360.*;
import ace.org.epms_backend.enums.FeedbackStatus;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.FeedbackMapper;
import ace.org.epms_backend.model.appraisal.Question;
import ace.org.epms_backend.model.feedback360.*;
import ace.org.epms_backend.repository.QuestionRepository;
import ace.org.epms_backend.repository.feedback360.*;
import ace.org.epms_backend.service.feedback360.FeedbackSubmissionService;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;
import ace.org.epms_backend.dto.notification.NotificationEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackSubmissionServiceImpl implements FeedbackSubmissionService {

    private final FeedbackRepository feedbackRepository;
    private final FeedbackResponseRepository responseRepository;
    private final FeedbackRequestRepository requestRepository;
    private final QuestionRepository questionRepository;
    private final FeedbackMapper feedbackMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public void submitFeedback(FeedbackSubmissionRequest request, Long evaluatorId) {
        FeedbackRequest feedbackRequest = requestRepository.findById(request.getRequestId())
                .orElseThrow(() -> new NotFoundException("Feedback request not found"));

        if (feedbackRequest.getStatus() == FeedbackStatus.COMPLETED) {
            throw new RuntimeException("Feedback already submitted for this request");
        }

        if (!feedbackRequest.getEvaluator().getId().equals(evaluatorId)) {
            throw new RuntimeException("You are not authorized to submit feedback for this request");
        }

        Feedback feedback = Feedback.builder()
                .request(feedbackRequest)
                .relationship(feedbackRequest.getRelationship())
                .overallComment(request.getOverallComment())
                .submittedAt(Instant.now())
                .build();

        List<FeedbackResponse> responses = request.getResponses().stream().map(respDto -> {
            Question question = questionRepository.findById(respDto.getQuestionId())
                    .orElseThrow(() -> new NotFoundException("Question not found: " + respDto.getQuestionId()));
            return FeedbackResponse.builder()
                    .feedback(feedback)
                    .question(question)
                    .score(respDto.getScore())
                    .comment(respDto.getComment())
                    .build();
        }).collect(Collectors.toList());

        // Calculate Average Score: (Total Points / (Questions * 5)) * 100
        int totalPoints = responses.stream().mapToInt(FeedbackResponse::getScore).sum();
        int questionCount = responses.size();
        BigDecimal averageScore = BigDecimal.valueOf(totalPoints)
                .divide(BigDecimal.valueOf(questionCount * 5), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));

        feedback.setAverageScore(averageScore);
        
        feedbackRepository.save(feedback);
        responseRepository.saveAll(responses);

        feedbackRequest.setStatus(FeedbackStatus.COMPLETED);
        requestRepository.save(feedbackRequest);

        // Notify Target User (the one being evaluated)
        eventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(feedbackRequest.getTargetUser().getId())
                .type(NotificationType.FEEDBACK_SUBMITTED)
                .title("Feedback Received")
                .message("A new feedback submission has been completed for you.")
                .referenceType(ReferenceType.FEEDBACK)
                .referenceId(feedbackRequest.getId())
                .actionUrl("/feedback/reports")
                .build());
    }

    @Override
    public FeedbackDetailsResponse getFeedbackByRequest(Long requestId) {
        Feedback feedback = feedbackRepository.findByRequestId(requestId)
                .orElseThrow(() -> new NotFoundException("Feedback not found"));
        
        FeedbackDetailsResponse response = feedbackMapper.toFeedbackDetails(feedback);
        response.setResponses(responseRepository.findByFeedbackId(feedback.getId()).stream()
                .map(feedbackMapper::toResponseDetails)
                .collect(Collectors.toList()));
        
        return response;
    }

    @Override
    public List<FeedbackDetailsResponse> getMySubmittedFeedbacks(Long evaluatorId) {
        return feedbackRepository.findByRequestEvaluatorId(evaluatorId).stream()
                .map(f -> {
                    FeedbackDetailsResponse res = feedbackMapper.toFeedbackDetails(f);
                    res.setResponses(responseRepository.findByFeedbackId(f.getId()).stream()
                            .map(feedbackMapper::toResponseDetails)
                            .collect(Collectors.toList()));
                    return res;
                }).collect(Collectors.toList());
    }

    @Override
    public List<FeedbackDetailsResponse> getFeedbackReceivedByEmployee(Long employeeId, Long cycleId) {
        return feedbackRepository.findByRequestTargetUserIdAndRequestCycleCycleId(employeeId, cycleId).stream()
                .map(f -> {
                    FeedbackDetailsResponse res = feedbackMapper.toFeedbackDetails(f);
                    res.setResponses(responseRepository.findByFeedbackId(f.getId()).stream()
                            .map(feedbackMapper::toResponseDetails)
                            .collect(Collectors.toList()));
                    return res;
                }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteFeedback(Long feedbackId) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new NotFoundException("Feedback not found"));
        
        FeedbackRequest request = feedback.getRequest();
        request.setStatus(FeedbackStatus.PENDING);
        requestRepository.save(request);
        
        responseRepository.deleteByFeedbackId(feedbackId);
        feedbackRepository.delete(feedback);
    }
}
