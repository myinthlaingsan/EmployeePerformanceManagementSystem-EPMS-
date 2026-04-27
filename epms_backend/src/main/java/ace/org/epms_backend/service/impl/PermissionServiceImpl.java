package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.org.AssignPermissionRequest;
import ace.org.epms_backend.dto.org.PermissionRequest;
import ace.org.epms_backend.dto.org.PermissionResponse;
import ace.org.epms_backend.dto.org.RoleLevelPermissionResponse;
import ace.org.epms_backend.exception.AlreadyActiveException;
import ace.org.epms_backend.exception.CannotDeleteException;
import ace.org.epms_backend.exception.CodeAlreadyExistsException;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.PermissionMapper;
import ace.org.epms_backend.model.employee.JobLevel;
import ace.org.epms_backend.model.employee.Permission;
import ace.org.epms_backend.model.employee.Role;
import ace.org.epms_backend.model.employee.RoleLevelPermission;
import ace.org.epms_backend.repository.JobLevelRepository;
import ace.org.epms_backend.repository.PermissionRepository;
import ace.org.epms_backend.repository.RoleLevelPermissionRepository;
import ace.org.epms_backend.repository.RoleRepository;
import ace.org.epms_backend.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PermissionServiceImpl implements PermissionService {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final JobLevelRepository jobLevelRepository;
    private final RoleLevelPermissionRepository roleLevelPermissionRepository;
    private final PermissionMapper permissionMapper;

    @Override
    @Transactional
    public PermissionResponse createPermission(PermissionRequest request) {
        if (permissionRepository.existsByPermissionName(request.getPermissionName())) {
            throw new CodeAlreadyExistsException("Permission name already exists");
        }
        Permission permission = permissionMapper.toEntity(request);
        permission = permissionRepository.save(permission);
        return permissionMapper.toResponse(permission);
    }

    @Override
    public List<PermissionResponse> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(permissionMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PermissionResponse getPermissionById(Long id) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Permission not found"));
        return permissionMapper.toResponse(permission);
    }

    @Override
    @Transactional
    public PermissionResponse updatePermission(Long id, PermissionRequest request) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Permission not found"));

        if (!permission.getPermissionName().equals(request.getPermissionName()) &&
            permissionRepository.existsByPermissionName(request.getPermissionName())) {
            throw new CodeAlreadyExistsException("Permission name already exists");
        }

        permissionMapper.updateEntity(request, permission);
        permission = permissionRepository.save(permission);
        return permissionMapper.toResponse(permission);
    }

    @Override
    @Transactional
    public void deletePermission(Long id) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Permission not found"));

        if (roleLevelPermissionRepository.existsByPermission(permission)) {
            throw new CannotDeleteException("Cannot delete permission as it is assigned to one or more role levels");
        }

        permissionRepository.delete(permission);
    }

    @Override
    @Transactional
    public void assignPermission(AssignPermissionRequest request) {
        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new NotFoundException("Role not found"));
        JobLevel level = jobLevelRepository.findById(request.getLevelId())
                .orElseThrow(() -> new NotFoundException("Job level not found"));
        Permission permission = permissionRepository.findById(request.getPermissionId())
                .orElseThrow(() -> new NotFoundException("Permission not found"));

        if (roleLevelPermissionRepository.existsByRoleAndLevelAndPermission(role, level, permission)) {
            throw new AlreadyActiveException("Permission is already assigned to this role and level");
        }

        RoleLevelPermission assignment = new RoleLevelPermission();
        assignment.setRole(role);
        assignment.setLevel(level);
        assignment.setPermission(permission);

        roleLevelPermissionRepository.save(assignment);
    }

    @Override
    @Transactional
    public void removeAssignedPermission(Long roleLevelPermissionId) {
        RoleLevelPermission assignment = roleLevelPermissionRepository.findById(roleLevelPermissionId)
                .orElseThrow(() -> new NotFoundException("Role level permission assignment not found"));
        
        roleLevelPermissionRepository.delete(assignment);
    }

    @Override
    public List<RoleLevelPermissionResponse> getAssignedPermissions(Long roleId, Long levelId) {
        return roleLevelPermissionRepository.findByRole_RoleIdAndLevel_LevelId(roleId, levelId).stream()
                .map(rlp -> RoleLevelPermissionResponse.builder()
                        .id(rlp.getId())
                        .roleId(rlp.getRole().getRoleId())
                        .roleName(rlp.getRole().getRoleName().name())
                        .levelId(rlp.getLevel().getLevelId())
                        .levelName(rlp.getLevel().getLevelName())
                        .permissionId(rlp.getPermission().getPermissionId())
                        .permissionName(rlp.getPermission().getPermissionName())
                        .build())
                .collect(Collectors.toList());
    }
}
