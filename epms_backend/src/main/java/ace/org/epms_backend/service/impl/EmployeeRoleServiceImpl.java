package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.employee.EmployeeResponse;
import ace.org.epms_backend.dto.org.AssignRoleRequest;
import ace.org.epms_backend.dto.org.RoleResponse;
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
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeRoleServiceImpl implements EmployeeRoleService {

    private final EmployeeRoleRepository employeeRoleRepository;
    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;

    @Override
    @Transactional
    public void assignRoleToEmployee(Long employeeId, AssignRoleRequest request) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new NotFoundException("Role not found"));

        if (employeeRoleRepository.existsByEmployee_IdAndRole_RoleId(employeeId, request.getRoleId())) {
            throw new RuntimeException("Role is already assigned to this employee");
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
                .map(this::mapToRoleResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void removeRoleFromEmployee(Long employeeId, Long roleId) {
        if (!employeeRoleRepository.existsByEmployee_IdAndRole_RoleId(employeeId, roleId)) {
            throw new NotFoundException("Employee does not have this role");
        }
        employeeRoleRepository.deleteByEmployee_IdAndRole_RoleId(employeeId, roleId);
    }

    @Override
    public List<EmployeeResponse> getEmployeesByRoleId(Long roleId) {
        if (!roleRepository.existsById(roleId)) {
            throw new NotFoundException("Role not found");
        }

        List<Employee> employees = employeeRoleRepository.findEmployeesByRoleId(roleId);

        return employees.stream()
                .map(this::mapToEmployeeResponse)
                .collect(Collectors.toList());
    }

    private RoleResponse mapToRoleResponse(Role role) {
        return RoleResponse.builder()
                .roleId(role.getRoleId())
                .roleName(role.getRoleName())
                .build();
    }

    private EmployeeResponse mapToEmployeeResponse(Employee employee) {
        return EmployeeResponse.builder()
                .id(employee.getId())
                .employeeCode(employee.getEmployeeCode())
                .staffName(employee.getStaffName())
                .email(employee.getEmail())
                .phoneNo(employee.getPhoneNo())
                .positionName(employee.getPosition() != null ? employee.getPosition().getPositionName() : null)
                .build();
    }
}
