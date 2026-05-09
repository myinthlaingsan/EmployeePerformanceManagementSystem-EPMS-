package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.PagedResponse;
import ace.org.epms_backend.dto.employee.*;
import ace.org.epms_backend.enums.EmployeeStatus;
import ace.org.epms_backend.exception.*;
import ace.org.epms_backend.mapper.EmployeeMapper;
import ace.org.epms_backend.model.employee.*;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.AuthService;
import ace.org.epms_backend.service.EmployeeService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import ace.org.epms_backend.repository.employee.ReportingLineRepository;
import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;
import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.enums.AuditAction;
import ace.org.epms_backend.enums.AuditStatus;
import ace.org.epms_backend.service.AuditService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {
    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final ResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final PositionRepository positionRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeMapper employeeMapper;
    private final EmployeeRoleRepository employeeRoleRepository;
    private final RoleLevelPermissionRepository roleLevelPermissionRepository;
    private final EmployeeDepartmentRepository employeeDepartmentRepository;
    private final ReportingLineRepository reportingLineRepository;
    private final AuthService authService;
    private final ApplicationEventPublisher applicationEventPublisher;
    private final AuditService auditService;

    @Override
    @Transactional
    public EmployeeResponse createEmployee(CreateEmployeeRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (email.isEmpty()) {
            throw new RuntimeException("Email is required");
        }
        if (employeeRepository.existsByEmail(request.getEmail())) {
            throw new EmailExistException("Email already exists");
        }
        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new NotFoundException("Role not found"));

        Position position = positionRepository.findById(request.getPositionId())
                .orElseThrow(() -> new NotFoundException("Position Not Found"));
        Department parentDept = departmentRepository.findById(request.getParentDepartmentId())
                .orElseThrow(() -> new NotFoundException("Parent Department Not Found"));

        Department currentDept = departmentRepository.findById(request.getCurrentDepartmentId())
                .orElseThrow(() -> new NotFoundException("Current Department Not Found"));
        Employee employee = employeeMapper.toEntity(request);

        employee.setEmail(email);
        employee.setPosition(position);
        employee.setLevel(position.getLevel()); // Set level from position
        // ...
        employee.setStatus(EmployeeStatus.INACTIVE);
        employee.setPassword(null); // user will set later
        employee.setEmployeeCode(generateEmployeeCode());
        Employee savedEmployee = employeeRepository.save(employee);
        // Assign initial department
        EmployeeDepartment empDept = new EmployeeDepartment();
        empDept.setEmployee(savedEmployee);
        empDept.setParentDepartment(parentDept); // Banking
        empDept.setCurrentDepartment(currentDept); // ERP
        empDept.setIsCurrent(true);
        empDept.setCreatedBy(authService.getCurrentUser().getId());
        employeeDepartmentRepository.save(empDept);
        // roles
        EmployeeRole employeeRole = new EmployeeRole();
        employeeRole.setEmployee(savedEmployee);
        employeeRole.setRole(role);
        employeeRoleRepository.save(employeeRole);
        // Generate token
        String token = UUID.randomUUID().toString();
        ResetToken resetToken = new ResetToken();
        resetToken.setToken(token);
        resetToken.setEmployee(savedEmployee);
        resetToken.setExpiryDate(LocalDateTime.now().plusHours(24));

        tokenRepository.save(resetToken);

        // Assign Manager (Reporting Line)
        // if (request.getDirectManagerId() != null) {
        // Employee manager = employeeRepository.findById(request.getDirectManagerId())
        // .orElseThrow(() -> new NotFoundException("Manager not found"));
        //
        // ReportingLine reportingLine = ReportingLine.builder()
        // .employee(savedEmployee)
        // .manager(manager)
        // .isActive(true)
        // .build();
        // reportingLineRepository.save(reportingLine);
        // }

        applicationEventPublisher.publishEvent(
                new EmployeeCreatedEvent(savedEmployee.getId(), token));

        auditService.log(AuditRequest.builder()
                .tableName("employees")
                .recordId(savedEmployee.getId())
                .action(AuditAction.INSERT)
                .newState(savedEmployee)
                .status(AuditStatus.SUCCESS)
                .build());

        return mapToResponse(savedEmployee);
    }

    @Override
    public void setPassword(String token, String newPassword) {
        ResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new InvalidTokenException("Invalid token"));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new TokenExpiredException("Token expired");
        }

        Employee emp = resetToken.getEmployee();

        emp.setPassword(passwordEncoder.encode(newPassword));
        emp.setStatus(EmployeeStatus.ACTIVE);
        Employee updated = employeeRepository.save(emp);

        auditService.log(AuditRequest.builder()
                .tableName("employees")
                .recordId(updated.getId())
                .action(AuditAction.UPDATE)
                .newState(updated)
                .status(AuditStatus.SUCCESS)
                .build());

        // Notify Account Activated
        applicationEventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(emp.getId())
                .type(NotificationType.ACCOUNT_ACTIVATED)
                .title("Account Activated")
                .message("Your EPMS account has been successfully activated.")
                .referenceType(ReferenceType.ACCOUNT)
                .actionUrl("/profile")
                .build());
        // OPTIONAL (recommended): delete token after use
        tokenRepository.delete(resetToken);
    }

    @Override
    public EmployeeResponse getById(Long id) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        return mapToResponse(emp);
    }

    @Override
    public List<EmployeeResponse> getAll() {
        return employeeRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public PagedResponse<EmployeeResponse> getAllPaginated(int page, int size) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("id").descending()
        );

        Page<Employee> employeePage = employeeRepository.findAllPaginated(pageable);

        List<EmployeeResponse> content = employeePage.getContent()
                .stream()
                .map(this::mapToResponse)
                .toList();

        return new PagedResponse<>(
                content,
                employeePage.getNumber(),
                employeePage.getSize(),
                employeePage.getTotalElements(),
                employeePage.getTotalPages(),
                employeePage.isLast()
        );
    }

    @Override
    public PagedResponse<EmployeeResponse> search(String query, int page, int size) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("id").descending()
        );

        Page<Employee> employeePage = employeeRepository.searchEmployees(query, pageable);

        List<EmployeeResponse> content = employeePage.getContent()
                .stream()
                .map(this::mapToResponse)
                .toList();

        return new PagedResponse<>(
                content,
                employeePage.getNumber(),
                employeePage.getSize(),
                employeePage.getTotalElements(),
                employeePage.getTotalPages(),
                employeePage.isLast()
        );
    }

    @Override
    public EmployeeResponse updateEmployee(Long id, UpdateEmployeeRequest request) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        employeeMapper.updateEmployeeFromDto(request, emp);

        Position position = positionRepository.findById(request.getPositionId())
                .orElseThrow(() -> new NotFoundException("Position Not Found"));
        emp.setPosition(position);
        emp.setLevel(position.getLevel()); // Set level from position

        Employee updated = employeeRepository.save(emp);

        auditService.log(AuditRequest.builder()
                .tableName("employees")
                .recordId(updated.getId())
                .action(AuditAction.UPDATE)
                .newState(updated)
                .status(AuditStatus.SUCCESS)
                .build());

        // Update Manager (Reporting Line)
        if (request.getDirectManagerId() != null) {
            Optional<ReportingLine> existingLine = reportingLineRepository
                    .findByEmployeeAndIsActiveTrue(updated);

            if (existingLine.isEmpty() || !existingLine.get().getManager().getId()
                    .equals(request.getDirectManagerId())) {
                // Deactivate old one
                existingLine.ifPresent(line -> {
                    line.setIsActive(false);
                    reportingLineRepository.save(line);
                });

                // Create new one
                Employee newManager = employeeRepository.findById(request.getDirectManagerId())
                        .orElseThrow(() -> new NotFoundException("Manager not found"));

                ReportingLine newLine = ReportingLine.builder()
                        .employee(updated)
                        .manager(newManager)
                        .isActive(true)
                        .build();
                reportingLineRepository.save(newLine);
            }
        }

        return mapToResponse(updated);
    }

    @Override
    public void deleteEmployee(Long id) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        emp.setIsActive(false);
        Employee updated = employeeRepository.save(emp);

        auditService.log(AuditRequest.builder()
                .tableName("employees")
                .recordId(updated.getId())
                .action(AuditAction.UPDATE)
                .newState(updated)
                .status(AuditStatus.SUCCESS)
                .build());
    }

    @Override
    public void activateEmployee(Long id) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Employee not found"));
        emp.setStatus(EmployeeStatus.ACTIVE);
        Employee updated = employeeRepository.save(emp);

        auditService.log(AuditRequest.builder()
                .tableName("employees")
                .recordId(updated.getId())
                .action(AuditAction.UPDATE)
                .newState(updated)
                .status(AuditStatus.SUCCESS)
                .build());
    }

    @Override
    public void deactivateEmployee(Long id) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Employee not found"));
        emp.setStatus(EmployeeStatus.INACTIVE);
        Employee updated = employeeRepository.save(emp);

        auditService.log(AuditRequest.builder()
                .tableName("employees")
                .recordId(updated.getId())
                .action(AuditAction.UPDATE)
                .newState(updated)
                .status(AuditStatus.SUCCESS)
                .build());
    }

    @Override
    public List<EmployeeResponse> getDirectReports(Long managerId) {
        Employee manager = employeeRepository.findById(managerId)
                .orElseThrow(() -> new NotFoundException("Manager not found"));

        return reportingLineRepository.findAllByManagerAndIsActiveTrue(manager).stream()
                .map(ReportingLine::getEmployee)
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public EmployeeResponse getManager(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        return reportingLineRepository.findByEmployeeAndIsActiveTrue(employee)
                .map(ReportingLine::getManager)
                .map(this::mapToResponse)
                .orElse(null);
    }

    @Override
    public Employee findByEmail(String email) {
        return employeeRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Employee not found with email: " + email));
    }

    @Override
    @Transactional
    public EmployeeResponse updateProfile(UpdateProfileRequest request) {
        Employee emp = authService.getCurrentUser();

        // Optional: prevent duplicate email
        if (request.getEmail() != null &&
                !request.getEmail().equals(emp.getEmail()) &&
                employeeRepository.existsByEmail(request.getEmail())) {

            throw new EmailExistException("Email already exists");
        }
        // Capture old state for audit
        Employee oldState = Employee.builder()
                .staffName(emp.getStaffName())
                .email(emp.getEmail())
                .phoneNo(emp.getPhoneNo())
                .build();

        // useMapstruct
        employeeMapper.updateProfileFromDto(request, emp);

        Employee updated = employeeRepository.save(emp);

        // Log Audit
        auditService.log(AuditRequest.builder()
                .tableName("employees")
                .recordId(updated.getId())
                .action(AuditAction.UPDATE)
                .oldState(oldState)
                .newState(updated)
                .status(AuditStatus.SUCCESS)
                .build());

        // Notify Profile Updated
        applicationEventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(updated.getId())
                .type(NotificationType.PROFILE_UPDATED)
                .title("Profile Updated")
                .message("Your profile information has been updated.")
                .referenceType(ReferenceType.ACCOUNT)
                .actionUrl("/profile")
                .build());

        return mapToResponse(updated);
    }

    @Override
    public void changePassword(Long id, ChangePasswordRequest request) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Employee not found"));
        if (!passwordEncoder.matches(request.getOldPassword(), emp.getPassword())) {
            throw new PasswordIncorrectException("Old password incorrect");
        }
        emp.setPassword(passwordEncoder.encode(request.getNewPassword()));
        Employee updated = employeeRepository.save(emp);

        auditService.log(AuditRequest.builder()
                .tableName("employees")
                .recordId(updated.getId())
                .action(AuditAction.UPDATE)
                .newState(updated)
                .status(AuditStatus.SUCCESS)
                .build());

        // Notify Password Changed
        applicationEventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(emp.getId())
                .type(NotificationType.PASSWORD_CHANGED)
                .title("Password Changed")
                .message("Your account password has been successfully changed.")
                .referenceType(ReferenceType.ACCOUNT)
                .actionUrl("/profile")
                .build());
    }

    private String generateEmployeeCode() {
        long count = employeeRepository.count() + 1;
        return String.format("EMP%05d", count);
    }

    private EmployeeResponse mapToResponse(Employee emp) {
        EmployeeResponse response = employeeMapper.toResponse(emp);
        List<Role> roles = employeeRoleRepository.findRolesByEmployeeId(emp.getId());
        List<String> roleNames = roles.stream()
                .map(role -> role.getRoleName().name())
                .toList();
        response.setRoles(roleNames);

        // Fetch permissions based on roles and level
        List<String> permissions = roleLevelPermissionRepository
                .findPermissionsByRolesAndLevel(roles, emp.getLevel())
                .stream()
                .map(Permission::getPermissionName)
                .toList();
        response.setPermissions(permissions);

        // Set Department Name
        employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(emp.getId())
                .ifPresent(ed -> {
                    response.setCurrentDepartmentName(
                            ed.getCurrentDepartment().getDepartmentName());
                    response.setCurrentDepartmentId(
                            ed.getCurrentDepartment().getId());
                    response.setParentDepartmentName(
                            ed.getParentDepartment().getDepartmentName());
                    response.setParentDepartmentId(
                            ed.getParentDepartment().getId());
                });
            // Set Manager Info
            reportingLineRepository.findByEmployeeAndIsActiveTrue(emp)
                    .ifPresent(line -> {
                            response.setDirectManagerId(line.getManager().getId());
                            response.setDirectManagerName(line.getManager().getStaffName());
                    });
        return response;
    }
}
