package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.org.AssignDepartmentRequest;
import ace.org.epms_backend.dto.org.EmployeeDepartmentResponse;

import java.util.List;

public interface EmployeeDepartmentService {
    EmployeeDepartmentResponse assignDepartment(Long employeeId, AssignDepartmentRequest request);
    List<EmployeeDepartmentResponse> getEmployeeDepartmentHistory(Long employeeId);
}
