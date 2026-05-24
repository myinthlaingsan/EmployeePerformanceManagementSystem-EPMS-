package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.auth.*;
import ace.org.epms_backend.dto.employee.EmployeeResponse;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.service.AuthService;
import ace.org.epms_backend.service.JwtService;
import ace.org.epms_backend.service.TokenBlacklistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody AuthRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(response));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(response));
    }

    @PutMapping("/unlock/{employeeId}")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<Employee>> unlockEmployee(
            @PathVariable Long employeeId) {
        Employee employee = authService.unlockEmployee(employeeId);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(employee));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getCurrentUser() {
        return ResponseEntity.ok(
                ApiResponse.success(authService.getCurrentUserProfile()));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(jakarta.servlet.http.HttpServletRequest request) {
        String token = jwtService.extractTokenFromRequest(request);
        if (token != null) {
            tokenBlacklistService.blacklistToken(token);
        }
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {

        authService.forgotPassword(request);

        return ResponseEntity.ok(
                ApiResponse.success(null)
        );
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        authService.resetPassword(request);

        return ResponseEntity.ok(
                ApiResponse.success(null)
        );
    }

    @GetMapping("/validate")
    public ResponseEntity<ApiResponse<Boolean>> validateToken(jakarta.servlet.http.HttpServletRequest request) {
        String token = jwtService.extractTokenFromRequest(request);
        boolean isValid = token != null && authService.validateToken(token);
        return ResponseEntity.ok(ApiResponse.success(isValid));
    }

    @PostMapping("/revoke-sessions/{employeeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> revokeSessions(@PathVariable Long employeeId) {
        authService.revokeUserSessions(employeeId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
