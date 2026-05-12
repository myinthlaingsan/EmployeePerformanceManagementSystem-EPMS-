package ace.org.epms_backend.controller;
import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.dashboard.AdminDashboardResponse;
import ace.org.epms_backend.dto.dashboard.EmployeeDashboardResponse;
import ace.org.epms_backend.dto.dashboard.HrDashboardResponse;
import ace.org.epms_backend.dto.dashboard.ManagerDashboardResponse;
import ace.org.epms_backend.model.UserPrincipal;
import ace.org.epms_backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/hr")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<HrDashboardResponse>> getHrDashboard() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getHrDashboard()));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getAdminDashboard() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getAdminDashboard()));
    }

    @GetMapping("/employee")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EmployeeDashboardResponse>> getEmployeeDashboard(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getEmployeeDashboard(principal.getEmployee().getId())));
    }

    @GetMapping("/manager")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ManagerDashboardResponse>> getManagerDashboard(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getManagerDashboard(principal.getEmployee().getId())));
    }
}
