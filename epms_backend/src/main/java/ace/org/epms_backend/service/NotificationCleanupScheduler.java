package ace.org.epms_backend.service;

import ace.org.epms_backend.model.Notification;
import ace.org.epms_backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
public class NotificationCleanupScheduler {

    private final NotificationRepository notificationRepository;

    /**
     * Runs every day at 2:00 AM.
     * Soft-deletes notifications older than 30 days.
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void markOldNotificationsAsDeleted() {
        // Calculate date 30 days ago
        Instant cutoffDate = Instant.now().minus(30, ChronoUnit.DAYS);

        // Find notifications that are older than 30 days and NOT yet deleted
        List<Notification> oldNotifications = 
                notificationRepository.findAllByCreatedAtBeforeAndIsDeletedFalse(cutoffDate);

        if (!oldNotifications.isEmpty()) {
            for (Notification n : oldNotifications) {
                n.setIsDeleted(true);
            }
            notificationRepository.saveAll(oldNotifications);
            System.out.println("[Notification Cleanup] Soft deleted " + oldNotifications.size() + " notifications.");
        }
    }
}
