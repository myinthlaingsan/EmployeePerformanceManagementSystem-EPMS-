package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.pip.PipObjectiveRequest;
import ace.org.epms_backend.dto.pip.PipObjectiveResponse;
import ace.org.epms_backend.enums.ObjectiveStatus;
import ace.org.epms_backend.exception.UserNotFoundException;
import ace.org.epms_backend.mapper.PipObjectiveMapper;
import ace.org.epms_backend.model.pip.PipObjective;
import ace.org.epms_backend.model.pip.PipRecord;
import ace.org.epms_backend.repository.PipObjectiveRepository;
import ace.org.epms_backend.repository.PipRecordRepository;
import ace.org.epms_backend.service.PipObjectiveService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PipObjectiveServiceImpl implements PipObjectiveService {

    private final PipObjectiveRepository objectiveRepository;
    private final PipRecordRepository pipRepository;
    private final PipObjectiveMapper mapper;

    @Override
    public PipObjectiveResponse createObjective(PipObjectiveRequest request) {

        PipRecord pip = pipRepository.findById(request.getPipId())
                .orElseThrow(() -> new UserNotFoundException("PIP not found"));

        PipObjective objective = mapper.toEntity(request);

        objective.setPip(pip);
        objective.setStatus(ObjectiveStatus.NOT_STARTED); // ✅ FIXED HERE

        objective = objectiveRepository.save(objective);

        return mapper.toResponse(objective);
    }

    @Override
    public List<PipObjectiveResponse> getByPipId(Long pipId) {
        return objectiveRepository.findByPip_PipId(pipId)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public PipObjectiveResponse updateObjectiveStatus(Long objectiveId, Boolean achieved) {

        PipObjective objective = objectiveRepository.findById(objectiveId)
                .orElseThrow(() -> new UserNotFoundException("Objective not found"));

        objective.setIsAchieved(achieved);

        // ✅ Proper lifecycle handling
        if (achieved) {
            objective.setStatus(ObjectiveStatus.COMPLETED);
        } else {
            objective.setStatus(ObjectiveStatus.IN_PROGRESS);
        }

        objective = objectiveRepository.save(objective);

        return mapper.toResponse(objective);
    }
}