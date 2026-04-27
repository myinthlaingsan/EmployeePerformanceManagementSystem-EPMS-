package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.auth.*;
import ace.org.epms_backend.dto.employee.EmployeeResponse;
import ace.org.epms_backend.model.employee.Employee;

public interface AuthService {
    AuthResponse login(AuthRequest authDto);
    AuthResponse refreshToken(RefreshTokenRequest refreshRequest);
    Employee unlockEmployee(Long employeeId);

    // Get current logged-in employee entity
    Employee getCurrentUser();

    // Optional: return DTO for frontend
    EmployeeResponse getCurrentUserProfile();
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
}
