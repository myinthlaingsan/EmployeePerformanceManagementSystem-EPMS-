package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.pip.PipProgressRequest;
import ace.org.epms_backend.dto.pip.PipProgressResponse;

import java.util.List;

public interface PipProgressService {

    PipProgressResponse addProgress(PipProgressRequest request);

    List<PipProgressResponse> getProgressByObjective(Long objectiveId);
}