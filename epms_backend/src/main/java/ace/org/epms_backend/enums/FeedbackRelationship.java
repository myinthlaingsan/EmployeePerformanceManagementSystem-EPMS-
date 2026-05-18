package ace.org.epms_backend.enums;

public enum FeedbackRelationship {
    MANAGER,
    PEER,
    SUBORDINATE,
    SELF,
    DIRECT_MANAGER,
    SUPERIOR;

    public FeedbackRelationship toEvaluatorPerspective() {
        switch (this) {
            case MANAGER:
            case SUPERIOR:
                return SUBORDINATE;
            case SUBORDINATE:
                return MANAGER;
            case PEER:
                return PEER;
            case SELF:
                return SELF;
            default:
                return this;
        }
    }
}
