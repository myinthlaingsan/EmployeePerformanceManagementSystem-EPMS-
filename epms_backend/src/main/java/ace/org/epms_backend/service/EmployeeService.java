package ace.org.epms_backend.service;

import org.springframework.stereotype.Service;

import ace.org.epms_backend.dto.employee.CreateEmployeeRequest;
import ace.org.epms_backend.dto.employee.EmployeeResponse;

public interface EmployeeService {
    EmployeeResponse createEmployee(CreateEmployeeRequest request);

    void setPassword(String token, String newPassword);
}