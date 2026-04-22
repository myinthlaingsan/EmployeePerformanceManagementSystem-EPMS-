package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.auth.AuthRequest;
import ace.org.epms_backend.dto.auth.AuthResponse;
import ace.org.epms_backend.dto.auth.RefreshTokenRequest;
import ace.org.epms_backend.dto.employee.EmployeeResponse;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @RequestBody AuthRequest request
    ){
        AuthResponse response = authService.login(request);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(response));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @RequestBody RefreshTokenRequest request
    ){
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(response));
    }

    @PutMapping("/unlock/{employeeId}")
    public ResponseEntity<ApiResponse<Employee>> unlockEmployee(
            @PathVariable Long employeeId
    ){
        Employee employee = authService.unlockEmployee(employeeId);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(employee));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getCurrentUser() {
        return ResponseEntity.ok(
                ApiResponse.success(authService.getCurrentUserProfile())
        );
    }

}
