package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.feedback360.FeedbackSubmissionRequest;
import ace.org.epms_backend.enums.FeedbackStatus;
import ace.org.epms_backend.model.appraisal.Question;
import ace.org.epms_backend.model.feedback360.Feedback;
import ace.org.epms_backend.model.feedback360.FeedbackRequest;
import ace.org.epms_backend.model.feedback360.FeedbackResponse;
import ace.org.epms_backend.repository.appraisal.QuestionRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackRequestRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackResponseRepository;
import ace.org.epms_backend.service.feedback360.FeedbackSubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class FeedbackSubmissionServiceImpl implements FeedbackSubmissionService {

    private final FeedbackRequestRepository feedbackRequestRepository;
    private final FeedbackRepository feedbackRepository;
    private final FeedbackResponseRepository feedbackResponseRepository;
    private final QuestionRepository questionRepository;

    @Override
    @Transactional
    public void submitFeedback(FeedbackSubmissionRequest request, Long evaluatorId) {
        FeedbackRequest feedbackRequest = feedbackRequestRepository.findById(request.getRequestId())
                .orElseThrow(() -> new RuntimeException("Feedback request not found"));

        if (!feedbackRequest.getEvaluator().getId().equals(evaluatorId)) {
            throw new RuntimeException("You are not authorized to submit this feedback");
        }

        if (feedbackRequest.getStatus() != FeedbackStatus.PENDING) {
            throw new RuntimeException("Feedback has already been submitted or is closed");
        }

        // 1. Create main Feedback record
        Feedback feedback = Feedback.builder()
                .request(feedbackRequest)
                .overallComment(request.getOverallComment())
                .submittedAt(Instant.now())
                .build();
        feedbackRepository.save(feedback);

        // 2. Create individual responses
        for (FeedbackSubmissionRequest.FeedbackAnswerRequest answerDTO : request.getAnswers()) {
            Question question = questionRepository.findById(answerDTO.getQuestionId())
                    .orElseThrow(() -> new RuntimeException("Question not found with ID: " + answerDTO.getQuestionId()));

            FeedbackResponse response = FeedbackResponse.builder()
                    .feedback(feedback)
                    .question(question)
                    .score(answerDTO.getScore())
                    .comment(answerDTO.getComment())
                    .build();
            feedbackResponseRepository.save(response);
        }

        // 3. Mark request as SUBMITTED
        feedbackRequest.setStatus(FeedbackStatus.SUBMITTED);
        feedbackRequestRepository.save(feedbackRequest);
    }
}
