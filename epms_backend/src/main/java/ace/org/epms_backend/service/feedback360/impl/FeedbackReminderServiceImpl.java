package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.enums.FeedbackStatus;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;
import ace.org.epms_backend.model.feedback360.FeedbackRequest;
import ace.org.epms_backend.repository.feedback360.FeedbackRequestRepository;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.service.feedback360.FeedbackReminderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeedbackReminderServiceImpl implements FeedbackReminderService {

    private static final Duration REMINDER_COOLDOWN = Duration.ofHours(24);

    private final FeedbackRequestRepository requestRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public void runScheduledReminders() {
        Instant now = Instant.now();

        // T-7 and T-2 day reminders
        List<FeedbackRequest> dueSoon = requestRepository.findPendingDueWithin(
                now, now.plus(Duration.ofDays(7)));
        dueSoon.forEach(req -> sendReminderIfNotRecent(req, now));

        // Escalate overdue to manager of the target employee
        List<FeedbackRequest> overdue = requestRepository.findOverdue(now);
        overdue.forEach(req -> escalateToManager(req, now));

        log.info("Scheduled 360 feedback reminders completed: {} due-soon, {} overdue", dueSoon.size(), overdue.size());
    }

    @Override
    @Transactional
    public void sendFeedbackReminders(Long cycleId) {
        Instant now = Instant.now();
        List<FeedbackRequest> pendingRequests = requestRepository.findByCycleCycleId(cycleId).stream()
                .filter(req -> req.getStatus() == FeedbackStatus.PENDING || req.getStatus() == FeedbackStatus.IN_PROGRESS)
                .collect(Collectors.toList());

        pendingRequests.forEach(req -> {
            eventPublisher.publishEvent(NotificationEvent.builder()
                    .recipientId(req.getEvaluator().getId())
                    .type(NotificationType.FEEDBACK_REQUESTED)
                    .title("Urgent Feedback Reminder")
                    .message("Please complete your pending 360° feedback request for "
                            + (Boolean.TRUE.equals(req.getIsAnonymous()) ? "a colleague" : req.getTargetUser().getStaffName())
                            + " as requested by HR.")
                    .referenceType(ReferenceType.FEEDBACK)
                    .referenceId(req.getId())
                    .actionUrl("/feedback/my-pending")
                    .build());
            req.setLastReminderSentAt(now);
            requestRepository.save(req);
        });

        log.info("Manual 360 feedback reminders sent for cycle {}: {} notifications triggered", cycleId, pendingRequests.size());
    }

    @Override
    @Transactional
    public void sendIndividualFeedbackReminder(Long requestId) {
        FeedbackRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Feedback request not found: " + requestId));

        if (req.getStatus() == FeedbackStatus.COMPLETED || req.getStatus() == FeedbackStatus.CANCELLED) {
            throw new IllegalStateException("Cannot send reminder for a " + req.getStatus() + " request.");
        }

        Instant now = Instant.now();
        eventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(req.getEvaluator().getId())
                .type(NotificationType.FEEDBACK_REQUESTED)
                .title("Urgent Feedback Reminder")
                .message("Please complete your pending 360° feedback request for "
                        + (Boolean.TRUE.equals(req.getIsAnonymous()) ? "a colleague" : req.getTargetUser().getStaffName())
                        + " as requested by HR.")
                .referenceType(ReferenceType.FEEDBACK)
                .referenceId(req.getId())
                .actionUrl("/feedback/my-pending")
                .build());
        req.setLastReminderSentAt(now);
        requestRepository.save(req);

        log.info("Manual individual 360 feedback reminder sent to evaluator {} for request {}", req.getEvaluator().getId(), requestId);
    }

    private void sendReminderIfNotRecent(FeedbackRequest request, Instant now) {
        Instant lastSent = request.getLastReminderSentAt();
        if (lastSent != null && Duration.between(lastSent, now).compareTo(REMINDER_COOLDOWN) < 0) {
            return;  // already reminded within the last 24 hours
        }

        eventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(request.getEvaluator().getId())
                .type(NotificationType.FEEDBACK_REQUESTED)
                .title("Feedback Reminder")
                .message("Please complete your pending 360° feedback before the due date.")
                .referenceType(ReferenceType.FEEDBACK)
                .referenceId(request.getId())
                .actionUrl("/feedback/my-pending")
                .build());

        request.setLastReminderSentAt(now);
        requestRepository.save(request);
        log.info("Reminder sent to evaluator {} for request {}", request.getEvaluator().getId(), request.getId());
    }

    private void escalateToManager(FeedbackRequest request, Instant now) {
        if (request.getTargetUser() == null) return;

        eventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(request.getTargetUser().getId())
                .type(NotificationType.FEEDBACK_REQUESTED)
                .title("Overdue Feedback Alert")
                .message("A 360° feedback request assigned to "
                        + request.getEvaluator().getStaffName()
                        + " is overdue.")
                .referenceType(ReferenceType.FEEDBACK)
                .referenceId(request.getId())
                .actionUrl("/feedback/reports")
                .build());

        log.info("Escalation sent to target {} for overdue request {}", request.getTargetUser().getId(), request.getId());
    }
}
