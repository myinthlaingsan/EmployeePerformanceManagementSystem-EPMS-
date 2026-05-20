package ace.org.epms_backend.enums;

public enum FeedbackStatus {
    PENDING,       // request created, evaluator not started
    IN_PROGRESS,   // draft saved, not yet submitted
    COMPLETED,     // submitted
    CANCELLED      // evaluator left org / removed by HR
}
