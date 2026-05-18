package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.auth.*;
import ace.org.epms_backend.dto.employee.EmployeeResponse;
import ace.org.epms_backend.exception.InvalidTokenException;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.exception.TokenExpiredException;
import ace.org.epms_backend.mapper.EmployeeMapper;
import ace.org.epms_backend.model.UserPrincipal;
import ace.org.epms_backend.model.auth.PasswordResetToken;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.Permission;
import ace.org.epms_backend.model.employee.Role;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.EmployeeRoleRepository;
import ace.org.epms_backend.repository.EmployeeDepartmentRepository;
import ace.org.epms_backend.repository.PassowrdResetTokenRepository;
import ace.org.epms_backend.repository.RoleLevelPermissionRepository;
import ace.org.epms_backend.service.AuthService;
import ace.org.epms_backend.service.JwtService;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;
import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.enums.AuditAction;
import ace.org.epms_backend.enums.AuditStatus;
import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final EmployeeRepository employeeRepository;
    private final AuthenticationManager authenticationManager;
    private final EmployeeMapper employeeMapper;
    private final EmployeeRoleRepository employeeRoleRepository;
    private final RoleLevelPermissionRepository roleLevelPermissionRepository;
    private final PassowrdResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmployeeDepartmentRepository employeeDepartmentRepository;
    private final ApplicationEventPublisher applicationEventPublisher;
    private final AuditService auditService;

    @Override
    public AuthResponse login(AuthRequest authDto) {
        Employee employee = employeeRepository.findByEmail(authDto.getEmail())
                .orElseThrow(() -> new NotFoundException("Email not found"));
        unlockIfTimeExpired(employee);
        if (employee.isAccountLocked()) {
            long minutesLeft = ChronoUnit.MINUTES.between(LocalDateTime.now(), employee.getLockTime().plusMinutes(15));
            if (minutesLeft < 0)
                minutesLeft = 0;
            throw new LockedException("Your account is Locked. Try again in " + minutesLeft + " minutes.");
        }
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            authDto.getEmail(),
                            authDto.getPassword()));
            if (authentication.isAuthenticated()) {
                employee.setFailedLoginAttempts(0);
                employee.setAccountLocked(false);
                employee.setLockTime(null);
                employeeRepository.save(employee);

                // UserDetails userDetails = (UserDetails) authentication.getPrincipal();
                UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
                String token = jwtService.generateAccessToken(userPrincipal);
                String refreshToken = jwtService.generateRefreshToken(userPrincipal);
                return new AuthResponse(token, refreshToken);
            }
        } catch (BadCredentialsException ex) {
            int newAttempts = employee.getFailedLoginAttempts() + 1;
            employee.setFailedLoginAttempts(newAttempts);
            String msg;
            if (newAttempts >= 3) {
                employee.setAccountLocked(true);
                employee.setLockTime(LocalDateTime.now());
                msg = "Invalid credentials. Your account has been locked after 3 failed attempts.";
            } else {
                int remaining = 3 - newAttempts;
                msg = "Invalid credentials. You have " + remaining + " more attempt(s) before your account is locked.";
            }
            employeeRepository.save(employee);
            throw new LockedException(msg);
        }
        return new AuthResponse("fail", "fail");
    }

    @Override
    public AuthResponse refreshToken(RefreshTokenRequest refreshRequest) {
        String refreshToken = refreshRequest.getRefreshToken();

        // extract username first to load user details
        String username = jwtService.extractUsername(refreshToken);
        // UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        UserPrincipal userPrincipal = (UserPrincipal) userDetailsService.loadUserByUsername(username);
        // Now validate the refresh token with the user details
        if (!jwtService.isTokenValid(refreshToken, userPrincipal)) {
            throw new InvalidTokenException("Invalid Refresh Token");
        }
        String newAccessToken = jwtService.generateAccessToken(userPrincipal);
        return new AuthResponse(newAccessToken, refreshToken);
    }

    @Override
    public Employee unlockEmployee(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("User not Found"));
        employee.setAccountLocked(false);
        employee.setFailedLoginAttempts(0);
        employee.setLockTime(null);
        Employee unlocked = employeeRepository.save(employee);

        auditService.log(AuditRequest.builder()
                .tableName("employees")
                .recordId(unlocked.getId())
                .action(AuditAction.UPDATE)
                .newState(unlocked)
                .status(AuditStatus.SUCCESS)
                .build());

        return unlocked;
    }

    @Override
    public Employee getCurrentUser() {

        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new InvalidTokenException(
                    "No user logged in or session expired. Please provide a valid authentication token.");
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof UserPrincipal userPrincipal) {
            return userPrincipal.getEmployee();
        }

        throw new InvalidTokenException("Invalid authentication principal");
    }

    @Override
    public EmployeeResponse getCurrentUserProfile() {
        return mapToResponse(getCurrentUser());
    }

    @Transactional
    @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        Employee emp = employeeRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new NotFoundException("Email not found"));
        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setEmployee(emp);
        resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(30));
        resetTokenRepository.save(resetToken);

        applicationEventPublisher.publishEvent(
                new ForgotPasswordEvent(emp.getId(), token));
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = resetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new InvalidTokenException("Invalid token"));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new TokenExpiredException("Token expired");
        }

        Employee emp = resetToken.getEmployee();

        emp.setPassword(passwordEncoder.encode(request.getNewPassword()));
        emp.setFailedLoginAttempts(0);
        emp.setAccountLocked(false);
        emp.setLockTime(null);

        employeeRepository.save(emp);

        auditService.log(AuditRequest.builder()
                .tableName("employees")
                .recordId(emp.getId())
                .action(AuditAction.UPDATE)
                .newState(emp)
                .status(AuditStatus.SUCCESS)
                .build());

        // Notify Password Reset
        applicationEventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(emp.getId())
                .type(NotificationType.PASSWORD_CHANGED)
                .title("Password Reset Successful")
                .message("Your password has been successfully reset. You can now login with your new password.")
                .referenceType(ReferenceType.ACCOUNT)
                .referenceId(emp.getId())
                .actionUrl("/login")
                .build());
        resetTokenRepository.delete(resetToken);
    }

    private EmployeeResponse mapToResponse(Employee emp) {
        EmployeeResponse response = employeeMapper.toResponse(emp);
        List<Role> roles = employeeRoleRepository.findRolesByEmployeeId(emp.getId());
        List<String> roleNames = roles.stream()
                .map(role -> role.getRoleName().name())
                .toList();
        response.setRoles(roleNames);

        // Fetch permissions based on roles and level
        List<String> permissions = roleLevelPermissionRepository.findPermissionsByRolesAndLevel(roles, emp.getLevel())
                .stream()
                .map(Permission::getPermissionName)
                .toList();
        response.setPermissions(permissions);

        // Set Department Info
        employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(emp.getId())
                .ifPresent(ed -> {
                    response.setCurrentDepartmentName(ed.getCurrentDepartment().getDepartmentName());
                    response.setCurrentDepartmentId(ed.getCurrentDepartment().getId());
                    response.setParentDepartmentName(ed.getParentDepartment().getDepartmentName());
                });

        return response;
    }

    public boolean unlockIfTimeExpired(Employee emp) {
        if (emp.isAccountLocked() && emp.getLockTime() != null) {
            LocalDateTime unlockTime = emp.getLockTime().plusMinutes(15);
            if (LocalDateTime.now().isAfter(unlockTime)) {
                emp.setAccountLocked(false);
                emp.setFailedLoginAttempts(0);
                emp.setLockTime(null);
                employeeRepository.save(emp);
                return true;
            }
        }
        return false;
    }

    @Override
    public boolean validateToken(String token) {
        try {
            String username = jwtService.extractUsername(token);
            UserPrincipal userPrincipal = (UserPrincipal) userDetailsService.loadUserByUsername(username);
            return jwtService.isTokenValid(token, userPrincipal);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    @Transactional
    public void revokeUserSessions(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Employee not found"));
        employee.setLastLogoutTime(LocalDateTime.now());
        employeeRepository.save(employee);
    }
}
