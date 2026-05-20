package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;
import ace.org.epms_backend.model.feedback360.FeedbackRequest;
import ace.org.epms_backend.repository.feedback360.FeedbackRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class FeedbackReminderScheduler {

    private static final Duration REMINDER_COOLDOWN = Duration.ofHours(24);

    private final FeedbackRequestRepository requestRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Scheduled(cron = "0 0 9 * * *")  // daily at 09:00
    @Transactional
    public void runReminders() {
        Instant now = Instant.now();

        // T-7 and T-2 day reminders
        List<FeedbackRequest> dueSoon = requestRepository.findPendingDueWithin(
                now, now.plus(Duration.ofDays(7)));
        dueSoon.forEach(req -> sendReminderIfNotRecent(req, now));

        // Escalate overdue to manager of the target employee
        List<FeedbackRequest> overdue = requestRepository.findOverdue(now);
        overdue.forEach(req -> escalateToManager(req, now));

        log.info("Reminder job completed: {} due-soon, {} overdue", dueSoon.size(), overdue.size());
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
