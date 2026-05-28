package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.feedback360.*;
import ace.org.epms_backend.enums.FeedbackRelationship;
import ace.org.epms_backend.enums.FeedbackStatus;
import ace.org.epms_backend.exception.AccessDeniedException;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.FeedbackMapper;
import ace.org.epms_backend.model.appraisal.Question;
import ace.org.epms_backend.model.feedback360.*;
import ace.org.epms_backend.repository.QuestionRepository;
import ace.org.epms_backend.repository.feedback360.*;
import ace.org.epms_backend.service.feedback360.FeedbackSubmissionService;
import ace.org.epms_backend.service.feedback360.SecurityHelper;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;
import ace.org.epms_backend.dto.notification.NotificationEvent;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackSubmissionServiceImpl implements FeedbackSubmissionService {

    private final FeedbackRepository feedbackRepository;
    private final FeedbackResponseRepository responseRepository;
    private final FeedbackRequestRepository requestRepository;
    private final FeedbackSummaryRepository summaryRepository;
    private final QuestionRepository questionRepository;
    private final FeedbackMapper feedbackMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final SecurityHelper securityHelper;

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

        // Validate required questions before building responses
        for (FeedbackResponseRequest r : request.getResponses()) {
            Question q = questionRepository.findById(r.getQuestionId())
                    .orElseThrow(() -> new NotFoundException("Question not found: " + r.getQuestionId()));
            if (Boolean.TRUE.equals(q.getIsRequired()) && r.getScore() == null) {
                throw new ValidationException("Required question " + q.getQuestionId() + " is missing a score");
            }
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

        // Average score: null scores (comment-only) are excluded from calculation
        List<Integer> ratings = responses.stream()
                .map(FeedbackResponse::getScore)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        BigDecimal averageScore = ratings.isEmpty()
                ? null
                : BigDecimal.valueOf(ratings.stream().mapToInt(Integer::intValue).sum())
                        .multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf((long) ratings.size() * 5), 2, RoundingMode.HALF_UP);

        feedback.setAverageScore(averageScore);

        // Cascade save: responses are saved via Feedback.responses collection
        feedback.setResponses(responses);
        feedbackRepository.save(feedback);

        feedbackRequest.setStatus(FeedbackStatus.COMPLETED);
        requestRepository.save(feedbackRequest);

        // Mark the target's summary stale so it gets recomputed
        summaryRepository.findByEmployeeIdAndCycleCycleId(
                feedbackRequest.getTargetUser().getId(),
                feedbackRequest.getCycle().getCycleId())
                .ifPresent(s -> {
                    s.setIsFinalized(false);
                    summaryRepository.save(s);
                });

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

        Long viewerId = securityHelper.currentUserId();
        if (viewerId == null) {
            throw new AccessDeniedException("User not authenticated.");
        }

        Long targetUserId = feedback.getRequest().getTargetUser().getId();
        Long cycleId = feedback.getRequest().getCycle().getCycleId();
        boolean isTargetViewingSelf = viewerId.equals(targetUserId);

        // Access check: evaluator, HR/Admin (non-self), Manager, or Target employee
        boolean isEvaluator = viewerId.equals(feedback.getRequest().getEvaluator().getId());
        boolean isPrivileged = securityHelper.hasAnyRole("HR", "ADMIN") && !isTargetViewingSelf;
        boolean isManager = securityHelper.hasAnyRole("MANAGER");

        if (!isEvaluator && !isTargetViewingSelf && !isPrivileged && !isManager) {
            throw new AccessDeniedException("You do not have permission to view this feedback.");
        }

        // Release check: target self-viewers must wait until the cycle is locked & finalized
        if (isTargetViewingSelf) {
            FeedbackSummary summary = summaryRepository.findByEmployeeIdAndCycleCycleId(targetUserId, cycleId).orElse(null);
            if (summary != null) {
                boolean isReleased = Boolean.TRUE.equals(summary.getIsFinalized())
                        && summary.getCalibrationStatus() == ace.org.epms_backend.enums.CalibrationStatus.LOCKED;
                if (!isReleased) {
                    throw new AccessDeniedException("Your feedback responses are not yet released.");
                }
            }
        }

        FeedbackDetailsResponse response = feedbackMapper.toFeedbackDetails(feedback);
        response.setResponses(responseRepository.findByFeedbackId(feedback.getId()).stream()
                .map(feedbackMapper::toResponseDetails)
                .collect(Collectors.toList()));

        // Masking: mask peer/subordinate evaluator name for self-viewing
        if (isTargetViewingSelf) {
            FeedbackRelationship rel = feedback.getRequest().getRelationship();
            if (rel == FeedbackRelationship.PEER) {
                response.setEvaluatorName("Anonymous Peer");
            } else if (rel == FeedbackRelationship.SUBORDINATE) {
                response.setEvaluatorName("Anonymous Subordinate");
            }
        }

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
        Long viewerId = securityHelper.currentUserId();
        if (viewerId == null) {
            throw new AccessDeniedException("User not authenticated.");
        }
        boolean isTargetViewingSelf = viewerId.equals(employeeId);
        boolean isPrivileged = securityHelper.hasAnyRole("HR", "ADMIN") && !isTargetViewingSelf;

        // Access check: only target or HR/Admin/Manager can view
        if (!isTargetViewingSelf && !securityHelper.hasAnyRole("HR", "ADMIN", "MANAGER")) {
            throw new AccessDeniedException("You do not have permission to view these feedback responses.");
        }

        if (isTargetViewingSelf) {
            // Self-viewing: check lock and finalization status
            FeedbackSummary summary = summaryRepository.findByEmployeeIdAndCycleCycleId(employeeId, cycleId).orElse(null);
            boolean isReleased = summary != null
                    && Boolean.TRUE.equals(summary.getIsFinalized())
                    && summary.getCalibrationStatus() == ace.org.epms_backend.enums.CalibrationStatus.LOCKED;
            if (!isReleased) {
                throw new AccessDeniedException("Your feedback responses are not yet released.");
            }
        }

        return feedbackRepository
                .findByRequestTargetUserIdAndRequestCycleCycleId(employeeId, cycleId)
                .stream()
                .filter(f -> {
                    FeedbackRelationship rel = f.getRequest().getRelationship();
                    if (isPrivileged) return true;
                    if (isTargetViewingSelf) {
                        // Allow all relationships (including peer/subordinate, now that they are masked)
                        return rel == FeedbackRelationship.SELF
                                || rel == FeedbackRelationship.DIRECT_MANAGER
                                || rel == FeedbackRelationship.PEER
                                || rel == FeedbackRelationship.SUBORDINATE;
                    }
                    return false;
                })
                .map(f -> {
                    FeedbackDetailsResponse res = feedbackMapper.toFeedbackDetails(f);
                    res.setResponses(responseRepository.findByFeedbackId(f.getId()).stream()
                            .map(feedbackMapper::toResponseDetails)
                            .collect(Collectors.toList()));

                    // Masking peer/subordinate evaluator names for self-viewing
                    if (isTargetViewingSelf) {
                        FeedbackRelationship rel = f.getRequest().getRelationship();
                        if (rel == FeedbackRelationship.PEER) {
                            res.setEvaluatorName("Anonymous Peer");
                        } else if (rel == FeedbackRelationship.SUBORDINATE) {
                            res.setEvaluatorName("Anonymous Subordinate");
                        }
                    }
                    return res;
                }).collect(Collectors.toList());
    }

    @Override
    public List<FeedbackDetailsResponse> getAllFeedbackForAudit(Long employeeId, Long cycleId) {
        Long viewerId = securityHelper.currentUserId();
        if (viewerId != null && viewerId.equals(employeeId)) {
            throw new AccessDeniedException(
                    "You cannot audit your own peer/subordinate feedback. Ask another HR member.");
        }
        return feedbackRepository
                .findByRequestTargetUserIdAndRequestCycleCycleId(employeeId, cycleId)
                .stream()
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
