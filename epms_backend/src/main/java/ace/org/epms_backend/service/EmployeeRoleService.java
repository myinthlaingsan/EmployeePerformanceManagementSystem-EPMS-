package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.org.AssignRoleRequest;
import ace.org.epms_backend.dto.org.RoleResponse;

import java.util.List;

public interface EmployeeRoleService {
    void assignRoleToEmployee(Long employeeId, AssignRoleRequest request);
    List<RoleResponse> getRolesByEmployeeId(Long employeeId);
}
