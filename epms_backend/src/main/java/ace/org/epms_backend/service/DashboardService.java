package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.dashboard.*;

public interface DashboardService {
    EmployeeDashboardResponse getEmployeeDashboard(Long employeeId);
    ManagerDashboardResponse getManagerDashboard(Long managerId);
    AdminDashboardResponse getAdminDashboard();
}
