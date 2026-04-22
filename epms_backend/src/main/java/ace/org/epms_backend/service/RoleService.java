package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.org.RoleRequest;
import ace.org.epms_backend.dto.org.RoleResponse;

import java.util.List;

public interface RoleService {
    RoleResponse createRole(RoleRequest request);

    List<RoleResponse> getAllRoles();

    RoleResponse getRoleById(Long id);

    RoleResponse updateRole(Long id, RoleRequest request);

    void deleteRole(Long id);
}
