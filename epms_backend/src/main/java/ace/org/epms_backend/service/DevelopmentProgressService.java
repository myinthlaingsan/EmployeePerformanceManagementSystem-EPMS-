package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.idp.DevelopmentProgressRequest;
import ace.org.epms_backend.dto.idp.DevelopmentProgressResponse;

import java.util.List;

public interface DevelopmentProgressService {
    DevelopmentProgressResponse addProgress(DevelopmentProgressRequest request);
    List<DevelopmentProgressResponse> getByGoal(Long goalId);
}
