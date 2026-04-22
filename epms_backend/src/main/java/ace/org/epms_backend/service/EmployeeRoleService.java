package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.employee.EmployeeResponse;
import ace.org.epms_backend.dto.org.AssignRoleRequest;
import ace.org.epms_backend.dto.org.RoleResponse;
import ace.org.epms_backend.model.employee.Role;

import java.util.List;

public interface EmployeeRoleService {
    void assignRoleToEmployee(Long employeeId, AssignRoleRequest request);

    List<RoleResponse> getRolesByEmployeeId(Long employeeId);

    void removeRoleFromEmployee(Long employeeId, Long roleId);

    List<EmployeeResponse> getEmployeesByRoleId(Long roleId);

    boolean existsByRole(Role role);

}
