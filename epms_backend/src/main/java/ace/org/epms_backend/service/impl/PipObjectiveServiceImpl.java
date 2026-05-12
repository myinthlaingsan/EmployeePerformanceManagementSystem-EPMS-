package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.pip.PipObjectiveRequest;
import ace.org.epms_backend.dto.pip.PipObjectiveResponse;
import ace.org.epms_backend.dto.pip.PipObjectiveUpdateRequest;
import ace.org.epms_backend.enums.ObjectiveStatus;
import ace.org.epms_backend.enums.PipStatus;
import ace.org.epms_backend.exception.AccessDeniedException;
import ace.org.epms_backend.exception.InvalidStateException;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.PipObjectiveMapper;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.pip.PipObjective;
import ace.org.epms_backend.model.pip.PipRecord;
import ace.org.epms_backend.repository.PipObjectiveRepository;
import ace.org.epms_backend.repository.PipProgressLogRepository;
import ace.org.epms_backend.repository.PipRecordRepository;
import ace.org.epms_backend.service.AuthService;
import ace.org.epms_backend.service.PipObjectiveService;
import lombok.RequiredArgsConstructor;
// import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PipObjectiveServiceImpl implements PipObjectiveService {

    private final PipObjectiveRepository objectiveRepository;
    private final PipRecordRepository pipRepository;
    private final PipProgressLogRepository progressLogRepository;
    private final PipObjectiveMapper mapper;
    private final AuthService authService;

    // =========================
    // CREATE OBJECTIVE (HR / MANAGER)
    // =========================
    @Override
    public PipObjectiveResponse createObjective(PipObjectiveRequest request) {

        PipRecord pip = pipRepository.findById(request.getPipId())
                .orElseThrow(() -> new NotFoundException("PIP not found"));

        if (pip.getStatus() == PipStatus.CLOSED) {
            throw new InvalidStateException("Objectives cannot be added to CLOSED PIPs");
        }

        PipObjective objective = mapper.toEntity(request);
        objective.setPip(pip);
        objective.setStatus(ObjectiveStatus.NOT_STARTED);

        return enrichObjectiveResponse(objectiveRepository.save(objective));
    }

    @Override
    public PipObjectiveResponse updateObjective(Long id, PipObjectiveUpdateRequest request) {
        PipObjective objective = objectiveRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Objective not found"));

        PipStatus status = objective.getPip().getStatus();
        if (status == PipStatus.CLOSED) {
            throw new InvalidStateException("Objectives cannot be edited after PIP is CLOSED");
        }

        if (request.getTitle() != null)
            objective.setTitle(request.getTitle());
        if (request.getDescription() != null)
            objective.setDescription(request.getDescription());
        if (request.getSuccessCriteria() != null)
            objective.setSuccessCriteria(request.getSuccessCriteria());

        return enrichObjectiveResponse(objectiveRepository.save(objective));
    }

    // =========================
    // GET OBJECTIVES (ALL ROLES)
    // =========================
    @Override
    public List<PipObjectiveResponse> getByPipId(Long pipId) {

        PipRecord pip = pipRepository.findById(pipId)
                .orElseThrow(() -> new NotFoundException("PIP not found"));

        Employee current = authService.getCurrentUser();

        // 🔐 ACCESS CONTROL: Allow if HR, or if the user is the assigned MANAGER or the
        // assigned EMPLOYEE
        boolean isHR = hasRole("HR");
        boolean isAssignedManager = pip.getManager().getId().equals(current.getId());
        boolean isAssignedEmployee = pip.getEmployee().getId().equals(current.getId());

        if (!isHR && !isAssignedManager && !isAssignedEmployee) {
            throw new AccessDeniedException("You do not have permission to view objectives for this PIP");
        }

        return objectiveRepository.findByPip_PipId(pipId)
                .stream()
                .map(this::enrichObjectiveResponse)
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

        if (objective.getPip().getStatus() == PipStatus.CLOSED) {
            throw new InvalidStateException("Objective status cannot be updated if PIP is CLOSED");
        }

        if (objective.getPip().getStatus() == PipStatus.DRAFT) {
            throw new InvalidStateException("Objective status cannot be changed while PIP is in DRAFT");
        }

        if (status == ObjectiveStatus.NOT_STARTED && objective.getStatus() != ObjectiveStatus.NOT_STARTED) {
            throw new InvalidStateException("Cannot revert to NOT_STARTED once the objective has started.");
        }

        objective.setStatus(status);
        objective.setIsAchieved(status == ObjectiveStatus.COMPLETED);
        objective.setUpdatedBy(authService.getCurrentUser().getId());

        return enrichObjectiveResponse(objectiveRepository.save(objective));
    }

    private PipObjectiveResponse enrichObjectiveResponse(PipObjective objective) {
        PipObjectiveResponse response = mapper.toResponse(objective);
        progressLogRepository.findFirstByObjective_ObjectiveIdOrderByCreatedAtDesc(objective.getObjectiveId())
                .ifPresent(log -> response.setCurrentProgress(log.getProgressPercent().intValue()));
        return response;
    }

    private boolean hasRole(String role) {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }
}
