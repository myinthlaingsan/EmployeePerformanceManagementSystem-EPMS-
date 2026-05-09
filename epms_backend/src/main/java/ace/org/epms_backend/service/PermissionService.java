package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.org.*;

import java.util.List;

public interface PermissionService {
    PermissionResponse createPermission(PermissionRequest request);
    List<PermissionResponse> getAllPermissions();
    PermissionResponse getPermissionById(Long id);
    PermissionResponse updatePermission(Long id, PermissionRequest request);
    void deletePermission(Long id);

    void assignPermission(AssignPermissionRequest request);
    void removeAssignedPermission(Long roleLevelPermissionId);
    List<RoleLevelPermissionResponse> getAssignedPermissions(Long roleId, Long levelId);

    PermissionMatrixResponse getPermissionMatrix();
    void updatePermissionMatrix(UpdatePermissionMatrixRequest request);
}
