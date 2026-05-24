package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.dto.feedback360.ScoringPolicyRequest;
import ace.org.epms_backend.dto.feedback360.ScoringPolicyResponse;

import java.util.List;

public interface ScoringPolicyService {
    List<ScoringPolicyResponse> getPoliciesByCycle(Long cycleId);
    ScoringPolicyResponse upsert(ScoringPolicyRequest request);
}
