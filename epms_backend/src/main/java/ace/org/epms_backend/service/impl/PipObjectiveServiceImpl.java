package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.pip.PipObjectiveRequest;
import ace.org.epms_backend.dto.pip.PipObjectiveResponse;
import ace.org.epms_backend.enums.ObjectiveStatus;
import ace.org.epms_backend.enums.PipStatus;
import ace.org.epms_backend.exception.AccessDeniedException;
import ace.org.epms_backend.exception.InvalidStateException;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.exception.UserNotFoundException;
import ace.org.epms_backend.mapper.PipObjectiveMapper;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.pip.PipObjective;
import ace.org.epms_backend.model.pip.PipRecord;
import ace.org.epms_backend.repository.PipObjectiveRepository;
import ace.org.epms_backend.repository.PipRecordRepository;
import ace.org.epms_backend.service.AuthService;
import ace.org.epms_backend.service.PipObjectiveService;
import lombok.RequiredArgsConstructor;
// import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;


import java.util.List;

@Service
@RequiredArgsConstructor
public class PipObjectiveServiceImpl implements PipObjectiveService {

    private final PipObjectiveRepository objectiveRepository;
    private final PipRecordRepository pipRepository;
    private final PipObjectiveMapper mapper;
    private final AuthService authService;

    // =========================
    // CREATE OBJECTIVE (HR / MANAGER)
    // =========================
    @Override
    public PipObjectiveResponse createObjective(PipObjectiveRequest request) {

        PipRecord pip = pipRepository.findById(request.getPipId())
                .orElseThrow(() -> new NotFoundException("PIP not found"));

        if (pip.getStatus() != PipStatus.DRAFT) {
            throw new InvalidStateException("Objectives can only be added to DRAFT PIP");
        }

        PipObjective objective = mapper.toEntity(request);
        objective.setPip(pip);
        objective.setStatus(ObjectiveStatus.NOT_STARTED);

        return mapper.toResponse(objectiveRepository.save(objective));
    }

    // =========================
    // GET OBJECTIVES (ALL ROLES)
    // =========================
    @Override
    public List<PipObjectiveResponse> getByPipId(Long pipId) {

        PipRecord pip = pipRepository.findById(pipId)
                .orElseThrow(() -> new NotFoundException("PIP not found"));

        Employee current = authService.getCurrentUser();

        // 🔐 EMPLOYEE CAN ONLY VIEW OWN PIP OBJECTIVES
        if (hasRole("EMPLOYEE") &&
                !pip.getEmployee().getId().equals(current.getId())) {
            throw new AccessDeniedException("Not allowed to view this PIP");
        }

        return objectiveRepository.findByPip_PipId(pipId)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    // =========================
    // UPDATE STATUS (MANAGER / HR ONLY)
    // =========================
    @Override
    public PipObjectiveResponse updateObjectiveStatus(Long id, ObjectiveStatus status) {

        if (hasRole("EMPLOYEE")) {
            throw new AccessDeniedException("Only Manager or HR can update objectives");
        }

        PipObjective objective = objectiveRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Objective not found"));

        if (objective.getPip().getStatus() != PipStatus.ACTIVE && objective.getPip().getStatus() != PipStatus.EXTENDED) {
            throw new InvalidStateException("Objective status can only be updated if PIP is ACTIVE or EXTENDED");
        }

        objective.setStatus(status);
        objective.setIsAchieved(status == ObjectiveStatus.COMPLETED);
        objective.setUpdatedBy(authService.getCurrentUser().getId());

        return mapper.toResponse(objectiveRepository.save(objective));
    }

    // =========================
    // HELPER METHODS
    // =========================
    private boolean hasRole(String role) {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }
}
