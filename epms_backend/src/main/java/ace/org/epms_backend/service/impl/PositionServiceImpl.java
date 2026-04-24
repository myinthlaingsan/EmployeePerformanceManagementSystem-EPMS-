package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.org.PositionRequest;
import ace.org.epms_backend.dto.org.PositionResponse;
import ace.org.epms_backend.exception.CannotDeleteException;
import ace.org.epms_backend.exception.CodeAlreadyExistsException;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.PositionMapper;
import ace.org.epms_backend.model.employee.JobLevel;
import ace.org.epms_backend.model.employee.Position;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.JobLevelRepository;
import ace.org.epms_backend.repository.PositionRepository;
import ace.org.epms_backend.service.PositionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PositionServiceImpl implements PositionService {

    private final PositionRepository positionRepository;
    private final JobLevelRepository jobLevelRepository;
    private final EmployeeRepository employeeRepository;
    private final PositionMapper positionMapper;

    @Override
    public PositionResponse createPosition(PositionRequest request) {
        if (positionRepository.existsByPositionCode(request.getPositionCode())) {
            throw new CodeAlreadyExistsException("Position code already exists");
        }
        
        JobLevel level = jobLevelRepository.findById(request.getLevelId())
                .orElseThrow(() -> new NotFoundException("Job level not found"));

        Position position = positionMapper.toEntity(request);
        position.setLevel(level);
        
        position = positionRepository.save(position);
        return positionMapper.toResponse(position);
    }

    @Override
    public List<PositionResponse> getAllPositions() {
        return positionRepository.findAll().stream()
                .map(positionMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PositionResponse> getPositionsByLevelId(Long levelId) {
        return positionRepository.findByLevel_LevelId(levelId).stream()
                .map(positionMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PositionResponse getPositionById(Long id) {
        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Position not found"));
        return positionMapper.toResponse(position);
    }

    @Override
    public PositionResponse updatePosition(Long id, PositionRequest request) {
        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Position not found"));

        if (!position.getPositionCode().equals(request.getPositionCode()) &&
            positionRepository.existsByPositionCode(request.getPositionCode())) {
            throw new CodeAlreadyExistsException("Position code already exists");
        }

        JobLevel level = jobLevelRepository.findById(request.getLevelId())
                .orElseThrow(() -> new NotFoundException("Job level not found"));

        positionMapper.updateEntity(request, position);
        position.setLevel(level);
        
        position = positionRepository.save(position);
        return positionMapper.toResponse(position);
    }

    @Override
    public void deletePosition(Long id) {
        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Position not found"));

        if (employeeRepository.existsByPosition(position)) {
            throw new CannotDeleteException("Cannot delete position as it is assigned to one or more employees");
        }

        positionRepository.delete(position);
    }
}
