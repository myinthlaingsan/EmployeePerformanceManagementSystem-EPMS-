package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.dto.idp.DevelopmentGoalRequest;
import ace.org.epms_backend.dto.idp.DevelopmentGoalResponse;
import ace.org.epms_backend.dto.idp.DevelopmentGoalUpdateRequest;
import ace.org.epms_backend.dto.org.RoleResponse;
import ace.org.epms_backend.enums.*;
import ace.org.epms_backend.exception.AccessDeniedException;
import ace.org.epms_backend.exception.InvalidStateException;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.DevelopmentGoalMapper;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.idp.DevelopmentGoal;
import ace.org.epms_backend.model.idp.DevelopmentPlan;
import ace.org.epms_backend.repository.DevelopmentGoalRepository;
import ace.org.epms_backend.repository.DevelopmentPlanRepository;
import ace.org.epms_backend.service.AuditService;
import ace.org.epms_backend.service.AuthService;
import ace.org.epms_backend.service.DevelopmentGoalService;
import ace.org.epms_backend.service.EmployeeRoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DevelopmentGoalServiceImpl implements DevelopmentGoalService {

    private final DevelopmentGoalRepository goalRepository;
    private final DevelopmentPlanRepository planRepository;
    private final DevelopmentGoalMapper goalMapper;
    private final AuthService authService;
    private final EmployeeRoleService employeeRoleService;
    private final AuditService auditService;

    @Override
    public DevelopmentGoalResponse createGoal(DevelopmentGoalRequest request) {
        DevelopmentPlan plan = findPlan(request.getIdpId());
        requireManagerOrHr(plan);
        ensurePlanAcceptsGoal(plan);
        validateTargetDate(plan, request.getTargetDate());

        DevelopmentGoal goal = goalMapper.toEntity(request);
        goal.setPlan(plan);
        goal.setStatus(DevelopmentGoalStatus.NOT_STARTED);
        goal.setProgressPercent(0);
        goal = goalRepository.save(goal);
        audit(goal.getGoalId(), AuditAction.INSERT, goal);
        return goalMapper.toResponse(goal);
    }

    @Override
    public DevelopmentGoalResponse updateGoal(Long goalId, DevelopmentGoalUpdateRequest request) {
        DevelopmentGoal goal = findGoal(goalId);
        DevelopmentPlan plan = goal.getPlan();
        requireManagerOrHr(plan);
        ensurePlanEditable(plan);
        ensureGoalNotStarted(goal);

        if (request.getTitle() != null) goal.setTitle(request.getTitle());
        if (request.getDescription() != null) goal.setDescription(request.getDescription());
        if (request.getCategory() != null) goal.setCategory(request.getCategory());
        if (request.getSuccessCriteria() != null) goal.setSuccessCriteria(request.getSuccessCriteria());
        if (request.getTargetDate() != null) {
            validateTargetDate(plan, request.getTargetDate());
            goal.setTargetDate(request.getTargetDate());
        }
        if (request.getStatus() != null) goal.setStatus(request.getStatus());
        if (request.getManagerComment() != null) goal.setManagerComment(request.getManagerComment());
        if (request.getEmployeeComment() != null) goal.setEmployeeComment(request.getEmployeeComment());

        goal = goalRepository.save(goal);
        audit(goal.getGoalId(), AuditAction.UPDATE, goal);
        return goalMapper.toResponse(goal);
    }

    @Override
    public DevelopmentGoalResponse updateStatus(Long goalId, DevelopmentGoalStatus status) {
        DevelopmentGoal goal = findGoal(goalId);
        requireManagerOrHr(goal.getPlan());
        ensurePlanEditable(goal.getPlan());
        goal.setStatus(status);
        if (status == DevelopmentGoalStatus.COMPLETED) {
            goal.setProgressPercent(100);
        }
        goal = goalRepository.save(goal);
        audit(goal.getGoalId(), AuditAction.UPDATE, goal);
        return goalMapper.toResponse(goal);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DevelopmentGoalResponse> getByPlan(Long idpId) {
        DevelopmentPlan plan = findPlan(idpId);
        requireParticipantOrHr(plan);
        return goalRepository.findByPlan_IdpId(idpId).stream().map(goalMapper::toResponse).toList();
    }

    @Override
    public void deleteGoal(Long goalId) {
        DevelopmentGoal goal = findGoal(goalId);
        requireManagerOrHr(goal.getPlan());
        ensurePlanEditable(goal.getPlan());
        ensureGoalNotStarted(goal);
        goalRepository.delete(goal);
        audit(goalId, AuditAction.DELETE, goal);
    }

    private DevelopmentPlan findPlan(Long idpId) {
        if (idpId == null) {
            throw new InvalidStateException("IDP id is required");
        }
        return planRepository.findById(idpId).orElseThrow(() -> new NotFoundException("IDP not found"));
    }

    private DevelopmentGoal findGoal(Long goalId) {
        if (goalId == null) {
            throw new InvalidStateException("Development goal id is required");
        }
        return goalRepository.findById(goalId).orElseThrow(() -> new NotFoundException("Development goal not found"));
    }

    private void ensurePlanAcceptsGoal(DevelopmentPlan plan) {
        if (plan.getStatus() != IdpStatus.DRAFT && plan.getStatus() != IdpStatus.ACTIVE) {
            throw new InvalidStateException("Goals can only be added to DRAFT or ACTIVE IDPs");
        }
    }

    private void ensurePlanEditable(DevelopmentPlan plan) {
        if (plan.getStatus() == IdpStatus.COMPLETED || plan.getStatus() == IdpStatus.CANCELLED) {
            throw new InvalidStateException("Cannot edit goals on a completed or cancelled IDP");
        }
    }

    private void ensureGoalNotStarted(DevelopmentGoal goal) {
        if (goal.getStatus() != DevelopmentGoalStatus.NOT_STARTED) {
            throw new InvalidStateException("Goals can only be edited or deleted before progress starts");
        }
    }

    private void validateTargetDate(DevelopmentPlan plan, LocalDate targetDate) {
        if (targetDate.isBefore(plan.getStartDate()) || targetDate.isAfter(plan.getEndDate())) {
            throw new InvalidStateException("Goal target date must be within the IDP date range");
        }
    }

    private void requireParticipantOrHr(DevelopmentPlan plan) {
        Employee current = authService.getCurrentUser();
        if (!isHr(current) && !isAdmin(current)
                && !plan.getEmployee().getId().equals(current.getId())
                && !plan.getManager().getId().equals(current.getId())) {
            throw new AccessDeniedException("You are not allowed to access these goals");
        }
    }

    private void requireManagerOrHr(DevelopmentPlan plan) {
        Employee current = authService.getCurrentUser();
        if (!isHr(current) && !isAdmin(current) && !plan.getManager().getId().equals(current.getId())) {
            throw new AccessDeniedException("Only HR, Admin, or the assigned Manager can manage development goals");
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

    private void audit(Long recordId, AuditAction action, Object state) {
        auditService.log(AuditRequest.builder()
                .tableName("development_goals")
                .recordId(recordId)
                .action(action)
                .newState(state)
                .status(AuditStatus.SUCCESS)
                .build());
    }
}
