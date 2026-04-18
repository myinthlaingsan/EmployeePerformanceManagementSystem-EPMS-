package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.org.DepartmentRequest;
import ace.org.epms_backend.dto.org.DepartmentResponse;

import java.util.List;

public interface DepartmentService {
    DepartmentResponse createDepartment(DepartmentRequest request);
    List<DepartmentResponse> getAllDepartments();
    DepartmentResponse getDepartmentById(Long id);
    DepartmentResponse updateDepartment(Long id, DepartmentRequest request);
    void deleteDepartment(Long id);
}
