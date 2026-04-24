package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.pip.PipObjectiveRequest;
import ace.org.epms_backend.dto.pip.PipObjectiveResponse;
import ace.org.epms_backend.enums.ObjectiveStatus;

import java.util.List;

public interface PipObjectiveService {

    PipObjectiveResponse createObjective(PipObjectiveRequest request);

    List<PipObjectiveResponse> getByPipId(Long pipId);

    PipObjectiveResponse updateObjectiveStatus(Long objectiveId, ObjectiveStatus status);
}