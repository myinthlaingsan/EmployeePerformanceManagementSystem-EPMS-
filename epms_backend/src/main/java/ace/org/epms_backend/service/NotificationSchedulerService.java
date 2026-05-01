package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.repository.AppraisalCycleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationSchedulerService {

    private final AppraisalCycleRepository cycleRepository;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Runs every day at 9:00 AM.
     * Finds active appraisal cycles closing in exactly 3 days and notifies everyone.
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void sendDeadlineReminders() {
        LocalDate threeDaysFromNow = LocalDate.now().plusDays(3);
        
        List<AppraisalCycle> upcomingDeadlines = cycleRepository.findByEndDateAndIsActiveTrue(threeDaysFromNow);

        for (AppraisalCycle cycle : upcomingDeadlines) {
            eventPublisher.publishEvent(NotificationEvent.builder()
                    .broadcast(true)
                    .type(NotificationType.DEADLINE_REMINDER)
                    .title("Upcoming Deadline: " + cycle.getCycleName())
                    .message("The appraisal cycle '" + cycle.getCycleName() + "' closes in 3 days. Please ensure all your self-assessments and feedbacks are submitted.")
                    .referenceType(ReferenceType.APPRAISAL)
                    .referenceId(cycle.getCycleId())
                    .actionUrl("/notifications")
                    .build());
        }
    }
}
