package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.org.RoleRequest;
import ace.org.epms_backend.dto.org.RoleResponse;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.RoleMapper;
import ace.org.epms_backend.model.employee.Role;
import ace.org.epms_backend.repository.EmployeeRoleRepository;
import ace.org.epms_backend.repository.RoleRepository;
import ace.org.epms_backend.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;
    private final EmployeeRoleRepository employeeRoleRepository;
    private final RoleMapper roleMapper;

    @Override
    public RoleResponse createRole(RoleRequest request) {
        if (roleRepository.existsByRoleName(request.getRoleName())) {
            throw new IllegalArgumentException("Role name already exists: " + request.getRoleName());
        }
        Role role = roleMapper.toEntity(request);
        role = roleRepository.save(role);
        return roleMapper.toResponse(role);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(roleMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RoleResponse getRoleById(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Role not found with id: " + id));
        return roleMapper.toResponse(role);
    }

    @Override
    public RoleResponse updateRole(Long id, RoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Role not found with id: " + id));

        if (!role.getRoleName().equals(request.getRoleName()) &&
                roleRepository.existsByRoleName(request.getRoleName())) {
            throw new IllegalArgumentException("Role name already exists: " + request.getRoleName());
        }

        roleMapper.updateEntity(request, role);
        role = roleRepository.save(role);
        return roleMapper.toResponse(role);
    }

    @Override
    public void deleteRole(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Role not found with id: " + id));

        // Prevent deletion if role is assigned to any employee
        if (employeeRoleRepository.existsByRole(role)) {
            throw new IllegalStateException("Cannot delete role as it is assigned to one or more employees.");
        }

        roleRepository.delete(role);
    }
}