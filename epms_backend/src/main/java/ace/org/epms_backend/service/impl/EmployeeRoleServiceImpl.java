package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.org.AssignRoleRequest;
import ace.org.epms_backend.dto.org.RoleResponse;
import ace.org.epms_backend.exception.AlreadyAssignException;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.EmployeeRole;
import ace.org.epms_backend.model.employee.Role;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.EmployeeRoleRepository;
import ace.org.epms_backend.repository.RoleRepository;
import ace.org.epms_backend.service.EmployeeRoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeRoleServiceImpl implements EmployeeRoleService {

    private final EmployeeRoleRepository employeeRoleRepository;
    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;

    @Override
    public void assignRoleToEmployee(Long employeeId, AssignRoleRequest request) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new NotFoundException("Role not found"));

        if (employeeRoleRepository.existsByEmployee_IdAndRole_RoleId(employeeId, request.getRoleId())) {
            throw new AlreadyAssignException("Role is already assigned to this employee");
        }

        EmployeeRole employeeRole = new EmployeeRole();
        employeeRole.setEmployee(employee);
        employeeRole.setRole(role);

        employeeRoleRepository.save(employeeRole);
    }

    @Override
    public List<RoleResponse> getRolesByEmployeeId(Long employeeId) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new NotFoundException("Employee not found");
        }

        List<Role> roles = employeeRoleRepository.findRolesByEmployeeId(employeeId);
        
        return roles.stream()
                .map(role -> RoleResponse.builder()
                        .roleId(role.getRoleId())
                        .roleName(role.getRoleName())
                        .build())
                .collect(Collectors.toList());
    }
}
