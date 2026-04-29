package ace.org.epms_backend.enums;

public enum NotificationType {
    //Appraisal Cycle
    APPRAISAL_CYCLE_OPENED,
    APPRAISAL_CYCLE_CLOSED,
    DEADLINE_REMINDER,

    // KPI
    KPI_ASSIGNED,
    KPI_SUBMITTED,
    KPI_APPROVED,
    KPI_REJECTED,

    // Self Assessment
    SELF_ASSESSMENT_OPENED,
    SELF_ASSESSMENT_SUBMITTED,
    SELF_ASSESSMENT_APPROVED,
    SELF_ASSESSMENT_REJECTED,

    // Feedback
    FEEDBACK_REQUESTED,
    FEEDBACK_REMINDER,
    FEEDBACK_SUBMITTED,

    // Collaboration
    COMMENT_ADDED,

    // Final Results
    FINAL_RESULT_PUBLISHED,

    // PIP
    PIP_CREATED,
    PIP_UPDATED,

    // System
    SYSTEM
}
