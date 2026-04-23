package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.dashboard.*;
import ace.org.epms_backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/employee/{id}")
    public ResponseEntity<ApiResponse<EmployeeDashboardResponse>> getEmployeeDashboard(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getEmployeeDashboard(id)));
    }

    @GetMapping("/manager/{id}")
    public ResponseEntity<ApiResponse<ManagerDashboardResponse>> getManagerDashboard(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getManagerDashboard(id)));
    }

    @GetMapping("/admin")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getAdminDashboard() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getAdminDashboard()));
    }
}
