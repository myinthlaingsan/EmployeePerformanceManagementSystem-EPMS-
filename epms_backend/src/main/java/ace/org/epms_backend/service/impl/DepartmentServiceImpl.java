package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.org.DepartmentRequest;
import ace.org.epms_backend.dto.org.DepartmentResponse;
import ace.org.epms_backend.exception.CannotDeleteException;
import ace.org.epms_backend.exception.CodeAlreadyExistsException;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.DepartmentMapper;
import ace.org.epms_backend.model.employee.Department;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.Role;
import ace.org.epms_backend.repository.DepartmentRepository;
import ace.org.epms_backend.repository.EmployeeDepartmentRepository;
import ace.org.epms_backend.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final EmployeeDepartmentRepository employeeDepartmentRepository;
    private final DepartmentMapper departmentMapper;
    private final ace.org.epms_backend.service.AuthService authService;
    private final ace.org.epms_backend.repository.EmployeeRoleRepository employeeRoleRepository;
    private final ace.org.epms_backend.repository.EmployeeRepository employeeRepository;

    @Override
    public DepartmentResponse createDepartment(DepartmentRequest request) {
        if (departmentRepository.existsByDepartmentCodeAndIsActiveTrue(request.getDepartmentCode())) {
            throw new CodeAlreadyExistsException("Department code already exists");
        }
        Department department = departmentMapper.toEntity(request);
        department = departmentRepository.save(department);
        return departmentMapper.toResponse(department);
    }

    @Override
    public List<DepartmentResponse> getAllDepartments() {
        Employee currentUser = authService.getCurrentUser();
        List<Role> roles = employeeRoleRepository.findRolesByEmployeeId(currentUser.getId());

        boolean isAdminOrHR = roles.stream().anyMatch(r -> 
            r.getRoleName() == ace.org.epms_backend.enums.RoleType.ADMIN || 
            r.getRoleName() == ace.org.epms_backend.enums.RoleType.HR
        );
        
        boolean isManager = roles.stream().anyMatch(r -> 
            r.getRoleName() == ace.org.epms_backend.enums.RoleType.MANAGER
        );

        if (isManager && !isAdminOrHR) {
            return employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(currentUser.getId())
                    .map(ed -> List.of(departmentMapper.toResponse(ed.getCurrentDepartment())))
                    .orElse(List.of());
        }

        return departmentRepository.findByIsActiveTrue().stream()
                .map(departmentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public DepartmentResponse getDepartmentById(Long id) {
        Department department = departmentRepository.findById(id)
                .filter(Department::getIsActive)
                .orElseThrow(() -> new NotFoundException("Department not found"));
        return departmentMapper.toResponse(department);
    }

    @Override
    public DepartmentResponse updateDepartment(Long id, DepartmentRequest request) {
        Department department = departmentRepository.findById(id)
                .filter(Department::getIsActive)
                .orElseThrow(() -> new NotFoundException("Department not found"));

        if (!department.getDepartmentCode().equals(request.getDepartmentCode()) && 
            departmentRepository.existsByDepartmentCodeAndIsActiveTrue(request.getDepartmentCode())) {
            throw new CodeAlreadyExistsException("Department code already exists");
        }
        departmentMapper.updateEntity(request, department);
        department = departmentRepository.save(department);
        return departmentMapper.toResponse(department);
    }

    @Override
    public void deleteDepartment(Long id) {
        Department department = departmentRepository.findById(id)
                .filter(Department::getIsActive)
                .orElseThrow(() -> new NotFoundException("Department not found"));

        if (employeeDepartmentRepository.existsByCurrentDepartmentIdAndIsCurrentTrue(id)) {
            throw new CannotDeleteException("Cannot delete department as it is assigned to one or more active employees");
        }

        department.setIsActive(false);
        departmentRepository.save(department);
    }

    @Override
    public List<DepartmentResponse> getActiveDepartments() {
        ace.org.epms_backend.model.employee.Employee currentUser = authService.getCurrentUser();
        List<ace.org.epms_backend.model.employee.Role> roles = employeeRoleRepository.findRolesByEmployeeId(currentUser.getId());
        
        boolean isAdminOrHR = roles.stream().anyMatch(r -> 
            r.getRoleName() == ace.org.epms_backend.enums.RoleType.ADMIN || 
            r.getRoleName() == ace.org.epms_backend.enums.RoleType.HR
        );
        
        boolean isManager = roles.stream().anyMatch(r -> 
            r.getRoleName() == ace.org.epms_backend.enums.RoleType.MANAGER
        );

        if (isManager && !isAdminOrHR) {
            return employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(currentUser.getId())
                    .map(ed -> List.of(departmentMapper.toResponse(ed.getCurrentDepartment())))
                    .orElse(List.of());
        }

        return departmentRepository.findByIsActiveTrue().stream()
                .map(departmentMapper::toResponse)
                .collect(Collectors.toList());
    }
    @Override
    public long getHeadcount(Long departmentId) {
        if (!departmentRepository.existsById(departmentId)) {
            throw new NotFoundException("Department not found");
        }
        return employeeDepartmentRepository.countByCurrentDepartmentIdAndIsCurrentTrue(departmentId);
    }
}
