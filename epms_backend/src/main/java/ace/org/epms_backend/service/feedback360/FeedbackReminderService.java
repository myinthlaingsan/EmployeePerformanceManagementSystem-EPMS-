package ace.org.epms_backend.service.feedback360;

public interface FeedbackReminderService {
    void sendFeedbackReminders(Long cycleId);
    void sendIndividualFeedbackReminder(Long requestId);
    void runScheduledReminders();
}
