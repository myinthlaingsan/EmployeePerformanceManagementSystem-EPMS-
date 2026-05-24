package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.dashboard.AdminDashboardResponse;
import ace.org.epms_backend.dto.dashboard.EmployeeDashboardResponse;
import ace.org.epms_backend.dto.dashboard.HrDashboardResponse;
import ace.org.epms_backend.dto.dashboard.ManagerDashboardResponse;

public interface DashboardService {
    HrDashboardResponse getHrDashboard();
    AdminDashboardResponse getAdminDashboard();
    EmployeeDashboardResponse getEmployeeDashboard(Long employeeId);
    ManagerDashboardResponse getManagerDashboard(Long managerId);
}
