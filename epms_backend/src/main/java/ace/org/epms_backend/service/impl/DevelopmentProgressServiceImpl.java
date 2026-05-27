package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.dto.idp.DevelopmentProgressRequest;
import ace.org.epms_backend.dto.idp.DevelopmentProgressResponse;
import ace.org.epms_backend.dto.org.RoleResponse;
import ace.org.epms_backend.enums.*;
import ace.org.epms_backend.exception.AccessDeniedException;
import ace.org.epms_backend.exception.InvalidStateException;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.DevelopmentProgressMapper;
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

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DevelopmentProgressServiceImpl implements DevelopmentProgressService {

    private final DevelopmentProgressUpdateRepository progressRepository;
    private final DevelopmentGoalRepository goalRepository;
    private final DevelopmentProgressMapper progressMapper;
    private final AuthService authService;
    private final EmployeeRoleService employeeRoleService;
    private final AuditService auditService;

    @Override
    public DevelopmentProgressResponse addProgress(DevelopmentProgressRequest request) {
        DevelopmentGoal goal = goalRepository.findById(request.getGoalId())
                .orElseThrow(() -> new NotFoundException("Development goal not found"));
        DevelopmentPlan plan = goal.getPlan();
        requireTargetEmployee(plan);

        if (plan.getStatus() != IdpStatus.ACTIVE) {
            throw new InvalidStateException("Progress can only be added to ACTIVE IDPs");
        }

        DevelopmentProgressUpdate update = progressMapper.toEntity(request);
        update.setGoal(goal);
        update.setUpdatedBy(authService.getCurrentUser());
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

        audit(update.getUpdateId(), AuditAction.INSERT, update);
        return toProgressResponse(update);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DevelopmentProgressResponse> getByGoal(Long goalId) {
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
                .newState(state)
                .status(AuditStatus.SUCCESS)
                .build());
    }
}
