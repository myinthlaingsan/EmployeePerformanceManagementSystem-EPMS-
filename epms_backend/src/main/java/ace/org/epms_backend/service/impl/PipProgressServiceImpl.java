package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.pip.PipProgressRequest;
import ace.org.epms_backend.dto.pip.PipProgressResponse;
import ace.org.epms_backend.mapper.PipProgressMapper;
import ace.org.epms_backend.model.pip.PipObjective;
import ace.org.epms_backend.model.pip.PipProgressLog;
import ace.org.epms_backend.repository.PipObjectiveRepository;
import ace.org.epms_backend.repository.PipProgressRepository;
import ace.org.epms_backend.service.PipProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PipProgressServiceImpl implements PipProgressService {

    private final PipProgressRepository progressRepository;
    private final PipObjectiveRepository objectiveRepository;
    private final PipProgressMapper mapper;

    @Override
    public PipProgressResponse addProgress(PipProgressRequest request) {

        PipObjective objective = objectiveRepository.findById(request.getObjectiveId())
                .orElseThrow(() -> new RuntimeException("Objective not found"));

        PipProgressLog log = mapper.toEntity(request);
        log.setObjective(objective);

        // 🔥 IMPORTANT (later connect with JWT user)
        log.setUpdatedBy(1L); // temporary

        return mapper.toResponse(progressRepository.save(log));
    }

    @Override
    public List<PipProgressResponse> getProgressByObjective(Long objectiveId) {
        return progressRepository.findByObjective_ObjectiveId(objectiveId)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }
}