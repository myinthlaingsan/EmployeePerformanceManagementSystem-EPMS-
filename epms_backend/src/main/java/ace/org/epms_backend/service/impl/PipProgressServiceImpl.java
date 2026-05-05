package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.pip.PipProgressRequest;
import ace.org.epms_backend.dto.pip.PipProgressResponse;
import ace.org.epms_backend.enums.ObjectiveStatus;
import ace.org.epms_backend.enums.PipStatus;
import ace.org.epms_backend.exception.AccessDeniedException;
import ace.org.epms_backend.exception.InvalidStateException;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.PipProgressMapper;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.pip.PipObjective;
import ace.org.epms_backend.model.pip.PipProgressLog;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.PipObjectiveRepository;
import ace.org.epms_backend.repository.PipProgressRepository;
import ace.org.epms_backend.service.AuthService;
import ace.org.epms_backend.service.PipProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PipProgressServiceImpl implements PipProgressService {

    private final PipProgressRepository progressRepository;
    private final PipObjectiveRepository objectiveRepository;
    private final EmployeeRepository employeeRepository;
    private final PipProgressMapper mapper;
    private final AuthService authService;
    @Override
    public PipProgressResponse addProgress(PipProgressRequest request) {

        Employee current = authService.getCurrentUser();

        PipObjective objective = objectiveRepository.findById(request.getObjectiveId())
                .orElseThrow(() -> new NotFoundException("Objective not found"));

        if (objective.getPip().getStatus() != PipStatus.ACTIVE && objective.getPip().getStatus() != PipStatus.EXTENDED) {
            throw new InvalidStateException("Can only log progress on ACTIVE or EXTENDED PIP");
        }

        // 🔐 ONLY EMPLOYEE OWNERS CAN ADD PROGRESS
        if (!objective.getPip().getEmployee().getId().equals(current.getId())) {
            throw new AccessDeniedException("Not your PIP objective");
        }

        if (request.getProgressPercent().compareTo(java.math.BigDecimal.ZERO) < 0 ||
                request.getProgressPercent().compareTo(new java.math.BigDecimal("100")) > 0) {
            throw new InvalidStateException("Progress percentage must be between 0 and 100");
        }

        List<PipProgressLog> previousLogs = progressRepository.findByObjective_ObjectiveId(objective.getObjectiveId());
        if (!previousLogs.isEmpty()) {
            java.math.BigDecimal maxPrevious = previousLogs.stream()
                    .map(PipProgressLog::getProgressPercent)
                    .max(java.math.BigDecimal::compareTo)
                    .orElse(java.math.BigDecimal.ZERO);
            if (request.getProgressPercent().compareTo(maxPrevious) <= 0) {
                throw new InvalidStateException("New progress must be greater than previous progress (" + maxPrevious + "%)");
            }
        }

        PipProgressLog log = mapper.toEntity(request);
        log.setObjective(objective);
        log.setUpdatedBy(current.getId());

        // Auto transition status if NOT_STARTED
        if (objective.getStatus() == ObjectiveStatus.NOT_STARTED) {
            objective.setStatus(ObjectiveStatus.IN_PROGRESS);
            objective.setUpdatedBy(current.getId()); // Track who triggered status change
            objectiveRepository.save(objective);
        }

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