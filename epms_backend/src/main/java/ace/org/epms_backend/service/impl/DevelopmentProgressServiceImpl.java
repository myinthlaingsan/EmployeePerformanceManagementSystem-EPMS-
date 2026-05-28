package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.dto.idp.DevelopmentProgressRequest;
import ace.org.epms_backend.dto.idp.DevelopmentProgressResponse;
import ace.org.epms_backend.dto.org.RoleResponse;
import ace.org.epms_backend.enums.*;
import ace.org.epms_backend.exception.AccessDeniedException;
import ace.org.epms_backend.exception.InvalidStateException;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.idp.DevelopmentGoal;
import ace.org.epms_backend.model.idp.DevelopmentPlan;
import ace.org.epms_backend.model.idp.DevelopmentProgressUpdate;
import ace.org.epms_backend.repository.DevelopmentGoalRepository;
import ace.org.epms_backend.repository.DevelopmentProgressUpdateRepository;
import ace.org.epms_backend.service.AuditService;
import ace.org.epms_backend.service.AuthService;
import ace.org.epms_backend.service.DevelopmentProgressService;
import ace.org.epms_backend.service.EmployeeRoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class DevelopmentProgressServiceImpl implements DevelopmentProgressService {

    private final DevelopmentProgressUpdateRepository progressRepository;
    private final DevelopmentGoalRepository goalRepository;
    private final AuthService authService;
    private final EmployeeRoleService employeeRoleService;
    private final AuditService auditService;

    @Override
    public DevelopmentProgressResponse addProgress(DevelopmentProgressRequest request) {
        if (request.getGoalId() == null) {
            throw new InvalidStateException("Development goal is required before progress can be updated");
        }
        DevelopmentGoal goal = goalRepository.findById(request.getGoalId())
                .orElseThrow(() -> new NotFoundException("Development goal not found"));
        DevelopmentPlan plan = goal.getPlan();
        requireTargetEmployee(plan);

        if (plan.getStatus() != IdpStatus.ACTIVE) {
            throw new InvalidStateException("Progress can only be added to ACTIVE IDPs");
        }

        Employee current = authService.getCurrentUser();

        DevelopmentProgressUpdate update = new DevelopmentProgressUpdate();
        update.setProgressNote(request.getProgressNote());
        update.setProgressPercent(request.getProgressPercent());
        update.setGoal(goal);
        update.setUpdatedBy(current);
        update = progressRepository.save(update);

        goal.setProgressPercent(request.getProgressPercent());
        if (request.getProgressPercent() >= 100) {
            goal.setStatus(DevelopmentGoalStatus.COMPLETED);
        } else if (request.getProgressPercent() > 0) {
            goal.setStatus(DevelopmentGoalStatus.IN_PROGRESS);
        } else {
            goal.setStatus(DevelopmentGoalStatus.NOT_STARTED);
        }
        goalRepository.save(goal);
        goalRepository.flush();
        progressRepository.flush();

        audit(update.getUpdateId(), AuditAction.INSERT, update);
        DevelopmentProgressResponse response = new DevelopmentProgressResponse();
        response.setUpdateId(update.getUpdateId());
        response.setGoalId(goal.getGoalId());
        response.setProgressNote(update.getProgressNote());
        response.setProgressPercent(update.getProgressPercent());
        response.setUpdatedBy(current.getId());
        response.setUpdatedByName(current.getStaffName());
        response.setCreatedAt(update.getCreatedAt());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DevelopmentProgressResponse> getByGoal(Long goalId) {
        if (goalId == null) {
            throw new InvalidStateException("Development goal is required before progress history can be loaded");
        }
        DevelopmentGoal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new NotFoundException("Development goal not found"));
        requireParticipantOrHr(goal.getPlan());
        return progressRepository.findByGoal_GoalIdOrderByCreatedAtDesc(goalId)
                .stream()
                .map(this::toProgressResponse)
                .toList();
    }

    private void requireTargetEmployee(DevelopmentPlan plan) {
        Employee current = authService.getCurrentUser();
        if (!plan.getEmployee().getId().equals(current.getId())) {
            throw new AccessDeniedException("Only the target employee can update IDP goal progress");
        }
    }

    private void requireParticipantOrHr(DevelopmentPlan plan) {
        Employee current = authService.getCurrentUser();
        if (!isHr(current) && !isAdmin(current)
                && !plan.getEmployee().getId().equals(current.getId())
                && !plan.getManager().getId().equals(current.getId())) {
            throw new AccessDeniedException("You are not allowed to access this development progress");
        }
    }

    private boolean isHr(Employee employee) {
        return hasRole(employee, "HR");
    }

    private boolean isAdmin(Employee employee) {
        return hasRole(employee, "ADMIN");
    }

    private boolean hasRole(Employee employee, String role) {
        return employeeRoleService.getRolesByEmployeeId(employee.getId())
                .stream()
                .map(RoleResponse::getRoleName)
                .anyMatch(roleName -> roleName.equalsIgnoreCase(role) || roleName.equalsIgnoreCase("ROLE_" + role));
    }

    private ace.org.epms_backend.dto.idp.DevelopmentProgressResponse toProgressResponse(DevelopmentProgressUpdate update) {
        ace.org.epms_backend.dto.idp.DevelopmentProgressResponse response = new ace.org.epms_backend.dto.idp.DevelopmentProgressResponse();
        response.setUpdateId(update.getUpdateId());
        response.setProgressNote(update.getProgressNote());
        response.setProgressPercent(update.getProgressPercent());
        response.setCreatedAt(update.getCreatedAt());
        if (update.getGoal() != null) {
            response.setGoalId(update.getGoal().getGoalId());
        }
        if (update.getUpdatedBy() != null) {
            response.setUpdatedBy(update.getUpdatedBy().getId());
            response.setUpdatedByName(update.getUpdatedBy().getStaffName());
        }
        return response;
    }

    private void audit(Long recordId, AuditAction action, Object state) {
        auditService.log(AuditRequest.builder()
                .tableName("development_progress_updates")
                .recordId(recordId)
                .action(action)
                .newState(toAuditState((DevelopmentProgressUpdate) state))
                .status(AuditStatus.SUCCESS)
                .build());
    }

    private Map<String, Object> toAuditState(DevelopmentProgressUpdate update) {
        Map<String, Object> state = new HashMap<>();
        state.put("updateId", update.getUpdateId());
        state.put("goalId", update.getGoal() != null ? update.getGoal().getGoalId() : null);
        state.put("progressPercent", update.getProgressPercent());
        state.put("updatedBy", update.getUpdatedBy() != null ? update.getUpdatedBy().getId() : null);
        return state;
    }
}
