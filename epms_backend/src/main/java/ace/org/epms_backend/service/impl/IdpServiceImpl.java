package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.dto.idp.IdpCreateRequest;
import ace.org.epms_backend.dto.idp.IdpResponse;
import ace.org.epms_backend.dto.idp.IdpUpdateRequest;
import ace.org.epms_backend.dto.org.RoleResponse;
import ace.org.epms_backend.enums.AuditAction;
import ace.org.epms_backend.enums.AuditStatus;
import ace.org.epms_backend.enums.DevelopmentGoalStatus;
import ace.org.epms_backend.enums.IdpStatus;
import ace.org.epms_backend.exception.AccessDeniedException;
import ace.org.epms_backend.exception.InvalidStateException;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.exception.UserNotFoundException;
import ace.org.epms_backend.mapper.IdpMapper;
import ace.org.epms_backend.model.appraisal.Appraisal;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.ReportingLine;
import ace.org.epms_backend.model.idp.DevelopmentGoal;
import ace.org.epms_backend.model.idp.DevelopmentPlan;
import ace.org.epms_backend.repository.AppraisalRepository;
import ace.org.epms_backend.repository.DevelopmentGoalRepository;
import ace.org.epms_backend.repository.DevelopmentPlanRepository;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.employee.ReportingLineRepository;
import ace.org.epms_backend.service.AuditService;
import ace.org.epms_backend.service.AuthService;
import ace.org.epms_backend.service.EmployeeRoleService;
import ace.org.epms_backend.service.IdpService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class IdpServiceImpl implements IdpService {

    private final DevelopmentPlanRepository planRepository;
    private final DevelopmentGoalRepository goalRepository;
    private final EmployeeRepository employeeRepository;
    private final AppraisalRepository appraisalRepository;
    private final ReportingLineRepository reportingLineRepository;
    private final IdpMapper idpMapper;
    private final AuthService authService;
    private final EmployeeRoleService employeeRoleService;
    private final AuditService auditService;

    @Override
    public IdpResponse createIdp(IdpCreateRequest request) {
        Employee current = authService.getCurrentUser();
        if (!isHr(current) && !isAdmin(current)) {
            throw new AccessDeniedException("Only HR or Admin can create IDPs");
        }

        validateDateRange(request.getStartDate(), request.getEndDate());
        validateFollowUpDates(request.getStartDate(), request.getEndDate(), request.getScheduledFollowUpDates());

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new UserNotFoundException("Employee not found"));

        Employee manager = resolveManager(request.getManagerId(), employee);

        Appraisal appraisal = null;
        if (request.getAppraisalId() != null) {
            appraisal = appraisalRepository.findById(request.getAppraisalId())
                    .orElseThrow(() -> new NotFoundException("Appraisal not found"));
        }

        DevelopmentPlan plan = idpMapper.toEntity(request);
        plan.setEmployee(employee);
        plan.setManager(manager);
        plan.setAppraisal(appraisal);
        plan.setStatus(IdpStatus.DRAFT);
        plan.setCreatedBy(current.getId());

        plan = planRepository.save(plan);
        audit(plan.getIdpId(), AuditAction.INSERT, plan);
        return enrich(plan);
    }

    @Override
    public IdpResponse updateIdp(Long id, IdpUpdateRequest request) {
        DevelopmentPlan plan = findPlan(id);
        requireManagerOrHr(plan);
        ensureEditable(plan);

        if (request.getManagerId() != null) {
            Employee manager = employeeRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new UserNotFoundException("Manager not found"));
            plan.setManager(manager);
        }
        if (request.getTitle() != null) plan.setTitle(request.getTitle());
        if (request.getSummary() != null) plan.setSummary(request.getSummary());
        if (request.getEndDate() != null) {
            validateDateRange(plan.getStartDate(), request.getEndDate());
            plan.setEndDate(request.getEndDate());
        }
        if (request.getScheduledFollowUpDates() != null) {
            validateFollowUpDates(plan.getStartDate(), plan.getEndDate(), request.getScheduledFollowUpDates());
            plan.setScheduledFollowUpDates(request.getScheduledFollowUpDates());
        }

        plan = planRepository.save(plan);
        audit(plan.getIdpId(), AuditAction.UPDATE, plan);
        return enrich(plan);
    }

    @Override
    @Transactional(readOnly = true)
    public IdpResponse getById(Long id) {
        DevelopmentPlan plan = findPlan(id);
        requireParticipantOrHr(plan);
        return enrich(plan);
    }

    @Override
    @Transactional(readOnly = true)
    public List<IdpResponse> getAll() {
        Employee current = authService.getCurrentUser();
        if (!isHr(current) && !isAdmin(current)) {
            throw new AccessDeniedException("Only HR or Admin can view all IDPs");
        }
        return planRepository.findAll().stream().map(this::enrich).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<IdpResponse> getByEmployee(Long employeeId) {
        Employee current = authService.getCurrentUser();
        if (!current.getId().equals(employeeId) && !isHr(current) && !isAdmin(current)) {
            throw new AccessDeniedException("You can only view your own development plans");
        }
        return planRepository.findByEmployeeId(employeeId).stream().map(this::enrich).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<IdpResponse> getByInvolvedUser(Long userId) {
        Employee current = authService.getCurrentUser();
        if (!current.getId().equals(userId) && !isHr(current) && !isAdmin(current)) {
            throw new AccessDeniedException("You can only view development plans you are involved in");
        }
        return planRepository.findByEmployeeIdOrManagerId(userId, userId).stream().map(this::enrich).toList();
    }

    @Override
    public IdpResponse activate(Long id) {
        DevelopmentPlan plan = findPlan(id);
        requireManagerOrHr(plan);
        if (plan.getStatus() != IdpStatus.DRAFT) {
            throw new InvalidStateException("Only DRAFT IDPs can be activated");
        }
        plan.setStatus(IdpStatus.ACTIVE);
        plan = planRepository.save(plan);
        audit(plan.getIdpId(), AuditAction.UPDATE, plan);
        return enrich(plan);
    }

    @Override
    public IdpResponse complete(Long id) {
        DevelopmentPlan plan = findPlan(id);
        requireManagerOrHr(plan);
        if (plan.getStatus() != IdpStatus.ACTIVE) {
            throw new InvalidStateException("Only ACTIVE IDPs can be completed");
        }
        plan.setStatus(IdpStatus.COMPLETED);
        plan = planRepository.save(plan);
        audit(plan.getIdpId(), AuditAction.UPDATE, plan);
        return enrich(plan);
    }

    @Override
    public IdpResponse cancel(Long id) {
        DevelopmentPlan plan = findPlan(id);
        requireManagerOrHr(plan);
        if (plan.getStatus() != IdpStatus.ACTIVE && plan.getStatus() != IdpStatus.DRAFT) {
            throw new InvalidStateException("Only DRAFT or ACTIVE IDPs can be cancelled");
        }
        plan.setStatus(IdpStatus.CANCELLED);
        plan = planRepository.save(plan);
        audit(plan.getIdpId(), AuditAction.UPDATE, plan);
        return enrich(plan);
    }

    @Override
    public void delete(Long id) {
        DevelopmentPlan plan = findPlan(id);
        requireHrOrAdmin();
        if (plan.getStatus() != IdpStatus.DRAFT) {
            throw new InvalidStateException("Only DRAFT IDPs can be deleted");
        }
        planRepository.delete(plan);
        audit(id, AuditAction.DELETE, plan);
    }

    private DevelopmentPlan findPlan(Long id) {
        return planRepository.findById(id).orElseThrow(() -> new NotFoundException("IDP not found"));
    }

    private Employee resolveManager(Long managerId, Employee employee) {
        if (managerId != null && managerId > 0) {
            return employeeRepository.findById(managerId)
                    .orElseThrow(() -> new UserNotFoundException("Manager not found"));
        }
        return reportingLineRepository.findFirstByEmployee_IdAndIsActiveTrue(employee.getId())
                .map(ReportingLine::getManager)
                .orElseThrow(() -> new InvalidStateException(
                        "Cannot create IDP because no active reporting line was found for " + employee.getStaffName()));
    }

    private IdpResponse enrich(DevelopmentPlan plan) {
        IdpResponse response = idpMapper.toResponse(plan);
        List<DevelopmentGoal> goals = goalRepository.findByPlan_IdpId(plan.getIdpId());
        int total = goals.size();
        long completed = goals.stream().filter(goal -> goal.getStatus() == DevelopmentGoalStatus.COMPLETED).count();
        int progress = total == 0
                ? 0
                : (int) Math.round(goals.stream()
                        .mapToInt(goal -> goal.getProgressPercent() == null ? 0 : goal.getProgressPercent())
                        .average()
                        .orElse(0));
        response.setGoalCount(total);
        response.setCompletedGoalCount((int) completed);
        response.setOverallProgress(progress);
        return response;
    }

    private void ensureEditable(DevelopmentPlan plan) {
        if (plan.getStatus() == IdpStatus.COMPLETED || plan.getStatus() == IdpStatus.CANCELLED) {
            throw new InvalidStateException("Cannot edit a completed or cancelled IDP");
        }
    }

    private void validateDateRange(java.time.LocalDate startDate, java.time.LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new InvalidStateException("Start date and end date are required");
        }
        if (endDate.isBefore(startDate)) {
            throw new InvalidStateException("End date cannot be before start date");
        }
    }

    private void validateFollowUpDates(
            java.time.LocalDate startDate,
            java.time.LocalDate endDate,
            List<java.time.LocalDate> followUpDates) {
        if (followUpDates == null) {
            return;
        }
        boolean hasOutOfRangeDate = followUpDates.stream()
                .anyMatch(date -> date != null && (date.isBefore(startDate) || date.isAfter(endDate)));
        if (hasOutOfRangeDate) {
            throw new InvalidStateException("Follow-up dates must be within the IDP date range");
        }
    }

    private void requireParticipantOrHr(DevelopmentPlan plan) {
        Employee current = authService.getCurrentUser();
        if (!isHr(current) && !isAdmin(current)
                && !plan.getEmployee().getId().equals(current.getId())
                && !plan.getManager().getId().equals(current.getId())) {
            throw new AccessDeniedException("You are not allowed to access this IDP");
        }
    }

    private void requireManagerOrHr(DevelopmentPlan plan) {
        Employee current = authService.getCurrentUser();
        if (!isHr(current) && !isAdmin(current) && !plan.getManager().getId().equals(current.getId())) {
            throw new AccessDeniedException("Only HR, Admin, or the assigned Manager can manage this IDP");
        }
    }

    private void requireHrOrAdmin() {
        Employee current = authService.getCurrentUser();
        if (!isHr(current) && !isAdmin(current)) {
            throw new AccessDeniedException("Only HR or Admin can delete IDPs");
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
                .tableName("development_plans")
                .recordId(recordId)
                .action(action)
                .newState(state)
                .status(AuditStatus.SUCCESS)
                .build());
    }
}
