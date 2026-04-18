package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.org.DepartmentRequest;
import ace.org.epms_backend.dto.org.DepartmentResponse;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.DepartmentMapper;
import ace.org.epms_backend.model.employee.Department;
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

    @Override
    public DepartmentResponse createDepartment(DepartmentRequest request) {
        if (departmentRepository.existsByDepartmentCodeAndIsActiveTrue(request.getDepartmentCode())) {
            throw new RuntimeException("Department code already exists");
        }
        Department department = departmentMapper.toEntity(request);
        department = departmentRepository.save(department);
        return departmentMapper.toResponse(department);
    }

    @Override
    public List<DepartmentResponse> getAllDepartments() {
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
            throw new RuntimeException("Department code already exists");
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
            throw new RuntimeException("Cannot delete department as it is assigned to one or more active employees");
        }

        department.setIsActive(false);
        departmentRepository.save(department);
    }
}
