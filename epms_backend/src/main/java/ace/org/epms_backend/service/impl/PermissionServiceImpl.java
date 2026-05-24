package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.org.*;
import ace.org.epms_backend.exception.AlreadyActiveException;
import ace.org.epms_backend.exception.CannotDeleteException;
import ace.org.epms_backend.exception.CodeAlreadyExistsException;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.JobLevelMapper;
import ace.org.epms_backend.mapper.PermissionMapper;
import ace.org.epms_backend.mapper.RoleMapper;
import ace.org.epms_backend.model.employee.JobLevel;
import ace.org.epms_backend.model.employee.Permission;
import ace.org.epms_backend.model.employee.Role;
import ace.org.epms_backend.model.employee.RoleLevelPermission;
import ace.org.epms_backend.repository.JobLevelRepository;
import ace.org.epms_backend.repository.PermissionRepository;
import ace.org.epms_backend.repository.RoleLevelPermissionRepository;
import ace.org.epms_backend.repository.RoleRepository;
import ace.org.epms_backend.service.PermissionService;
import ace.org.epms_backend.enums.AuditAction;
import ace.org.epms_backend.enums.AuditStatus;
import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
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
    private final RoleMapper roleMapper;
    private final JobLevelMapper jobLevelMapper;
    private final AuditService auditService;

    @Override
    @Transactional
    public PermissionResponse createPermission(PermissionRequest request) {
        if (permissionRepository.existsByPermissionName(request.getPermissionName())) {
            throw new CodeAlreadyExistsException("Permission name already exists");
        }
        Permission permission = permissionMapper.toEntity(request);
        permission = permissionRepository.save(permission);

        auditService.log(AuditRequest.builder()
                .tableName("permissions")
                .recordId(permission.getPermissionId())
                .action(AuditAction.INSERT)
                .newState(permission)
                .status(AuditStatus.SUCCESS)
                .build());

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

        auditService.log(AuditRequest.builder()
                .tableName("permissions")
                .recordId(permission.getPermissionId())
                .action(AuditAction.UPDATE)
                .newState(permission)
                .status(AuditStatus.SUCCESS)
                .build());

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

        auditService.log(AuditRequest.builder()
                .tableName("permissions")
                .recordId(permission.getPermissionId())
                .action(AuditAction.DELETE)
                .oldState(permission)
                .status(AuditStatus.SUCCESS)
                .build());
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

        RoleLevelPermission saved = roleLevelPermissionRepository.save(assignment);

        auditService.log(AuditRequest.builder()
                .tableName("role_level_permissions")
                .recordId(saved.getId())
                .action(AuditAction.INSERT)
                .newState(saved)
                .status(AuditStatus.SUCCESS)
                .build());
    }

    @Override
    @Transactional
    public void removeAssignedPermission(Long roleLevelPermissionId) {
        RoleLevelPermission assignment = roleLevelPermissionRepository.findById(roleLevelPermissionId)
                .orElseThrow(() -> new NotFoundException("Role level permission assignment not found"));
        
        roleLevelPermissionRepository.delete(assignment);

        auditService.log(AuditRequest.builder()
                .tableName("role_level_permissions")
                .recordId(assignment.getId())
                .action(AuditAction.DELETE)
                .oldState(assignment)
                .status(AuditStatus.SUCCESS)
                .build());
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

    @Override
    public PermissionMatrixResponse getPermissionMatrix() {
        List<Role> roles = roleRepository.findAll();
        List<JobLevel> levels = jobLevelRepository.findAll();
        List<Permission> permissions = permissionRepository.findAll();
        List<RoleLevelPermission> assignments = roleLevelPermissionRepository.findAll();

        List<RoleLevelMapping> matrix = new ArrayList<>();

        for (Role role : roles) {
            for (JobLevel level : levels) {
                List<Long> assignedPermissionIds = assignments.stream()
                        .filter(a -> a.getRole().getRoleId().equals(role.getRoleId()) &&
                                     a.getLevel().getLevelId().equals(level.getLevelId()))
                        .map(a -> a.getPermission().getPermissionId())
                        .collect(Collectors.toList());

                matrix.add(RoleLevelMapping.builder()
                        .roleId(role.getRoleId())
                        .levelId(level.getLevelId())
                        .permissionIds(assignedPermissionIds)
                        .build());
            }
        }

        return PermissionMatrixResponse.builder()
                .roles(roles.stream().map(roleMapper::toResponse).collect(Collectors.toList()))
                .levels(levels.stream().map(jobLevelMapper::toResponse).collect(Collectors.toList()))
                .permissions(permissions.stream().map(permissionMapper::toResponse).collect(Collectors.toList()))
                .matrix(matrix)
                .build();
    }

    @Override
    @Transactional
    public void updatePermissionMatrix(UpdatePermissionMatrixRequest request) {
        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new NotFoundException("Role not found"));
        JobLevel level = jobLevelRepository.findById(request.getLevelId())
                .orElseThrow(() -> new NotFoundException("Job level not found"));

        // Remove existing assignments for this role/level combo
        List<RoleLevelPermission> existing = roleLevelPermissionRepository.findByRole_RoleIdAndLevel_LevelId(request.getRoleId(), request.getLevelId());
        roleLevelPermissionRepository.deleteAll(existing);

        // Add new assignments
        for (Long permissionId : request.getPermissionIds()) {
            Permission permission = permissionRepository.findById(permissionId)
                    .orElseThrow(() -> new NotFoundException("Permission not found with id: " + permissionId));
            
            RoleLevelPermission assignment = new RoleLevelPermission();
            assignment.setRole(role);
            assignment.setLevel(level);
            assignment.setPermission(permission);
            roleLevelPermissionRepository.save(assignment);
        }

        auditService.log(AuditRequest.builder()
                .tableName("role_level_permissions")
                .action(AuditAction.UPDATE)
                .newState("Updated permissions for Role: " + role.getRoleName() + ", Level: " + level.getLevelName())
                .status(AuditStatus.SUCCESS)
                .build());
    }
}
