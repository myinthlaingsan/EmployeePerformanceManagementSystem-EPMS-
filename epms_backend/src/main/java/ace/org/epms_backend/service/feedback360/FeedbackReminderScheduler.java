package ace.org.epms_backend.service.feedback360;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class FeedbackReminderScheduler {

    private final FeedbackReminderService reminderService;

    @Scheduled(cron = "0 0 9 * * *")  // daily at 09:00
    public void runReminders() {
        log.info("Running scheduled 360 feedback reminders...");
        reminderService.runScheduledReminders();
    }
}
