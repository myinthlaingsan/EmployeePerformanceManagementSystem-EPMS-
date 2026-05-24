package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.org.AssignDepartmentRequest;
import ace.org.epms_backend.dto.org.EmployeeDepartmentResponse;
import ace.org.epms_backend.exception.AlreadyActiveException;
import ace.org.epms_backend.exception.CannotAssignException;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.EmployeeDepartmentMapper;
import ace.org.epms_backend.model.employee.Department;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.EmployeeDepartment;
import ace.org.epms_backend.repository.DepartmentRepository;
import ace.org.epms_backend.repository.EmployeeDepartmentRepository;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.service.AuthService;
import ace.org.epms_backend.service.EmployeeDepartmentService;
import ace.org.epms_backend.enums.AuditAction;
import ace.org.epms_backend.enums.AuditStatus;
import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeDepartmentServiceImpl implements EmployeeDepartmentService {

    private final EmployeeDepartmentRepository employeeDepartmentRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeDepartmentMapper mapper;
    private final AuthService authService;
    private final AuditService auditService;
    @Override
    public EmployeeDepartmentResponse assignDepartment(AssignDepartmentRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        Department currentDepartment = departmentRepository.findById(request.getCurrentDepartmentId())
                .orElseThrow(() -> new NotFoundException("Current department not found"));
                
        if (!currentDepartment.getIsActive()) {
            throw new CannotAssignException("Cannot assign an inactive department");
        }

        Department parentDepartment = null;
        if (request.getParentDepartmentId() != null) {
            parentDepartment = departmentRepository.findById(request.getParentDepartmentId())
                .orElseThrow(() -> new NotFoundException("Parent department not found"));
                
            if (!parentDepartment.getIsActive()) {
                throw new CannotAssignException("Cannot assign an inactive parent department");
            }
        }

        Optional<EmployeeDepartment> currentAssignment = employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(request.getEmployeeId());
        if (currentAssignment.isPresent()) {
            EmployeeDepartment previous = currentAssignment.get();
            if (previous.getCurrentDepartment().getId().equals(currentDepartment.getId())) {
                throw new AlreadyActiveException("Employee is already active in this department");
            }
            previous.setIsCurrent(false);
            employeeDepartmentRepository.save(previous);
        }

        EmployeeDepartment newAssignment = new EmployeeDepartment();
        newAssignment.setEmployee(employee);
        newAssignment.setCurrentDepartment(currentDepartment);
        newAssignment.setParentDepartment(parentDepartment);
        newAssignment.setIsCurrent(true);
        newAssignment.setCreatedBy(authService.getCurrentUser().getId());
        newAssignment = employeeDepartmentRepository.save(newAssignment);

        auditService.log(AuditRequest.builder()
                .tableName("employee_departments")
                .recordId(newAssignment.getId())
                .action(AuditAction.UPDATE) // It's technically an update to the employee's location
                .newState(newAssignment)
                .status(AuditStatus.SUCCESS)
                .build());

        return mapper.toResponse(newAssignment);
    }

    @Override
    public List<EmployeeDepartmentResponse> getEmployeeDepartmentHistory(Long employeeId) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new NotFoundException("Employee not found");
        }
        
        return employeeDepartmentRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
}
