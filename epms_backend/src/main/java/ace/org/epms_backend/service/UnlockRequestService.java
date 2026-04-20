package ace.org.epms_backend.service;

public interface UnlockRequestService {
    void requestUnlock(Long appraisalId, String reason, Long managerId);
    void approve(Long requestId);
}
