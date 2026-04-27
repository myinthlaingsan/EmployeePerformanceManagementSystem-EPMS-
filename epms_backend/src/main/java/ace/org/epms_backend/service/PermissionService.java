package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.org.AssignPermissionRequest;
import ace.org.epms_backend.dto.org.PermissionRequest;
import ace.org.epms_backend.dto.org.PermissionResponse;

import java.util.List;

public interface PermissionService {
    PermissionResponse createPermission(PermissionRequest request);
    List<PermissionResponse> getAllPermissions();
    PermissionResponse getPermissionById(Long id);
    PermissionResponse updatePermission(Long id, PermissionRequest request);
    void deletePermission(Long id);

    void assignPermission(AssignPermissionRequest request);
    void removeAssignedPermission(Long roleLevelPermissionId);
    List<ace.org.epms_backend.dto.org.RoleLevelPermissionResponse> getAssignedPermissions(Long roleId, Long levelId);
}
