package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.employee.*;
import ace.org.epms_backend.model.employee.Employee;

import java.util.List;

public interface EmployeeService {
    EmployeeResponse createEmployee(CreateEmployeeRequest request);

    void setPassword(String token, String newPassword);

    // NEW - CORE CRUD
    EmployeeResponse getById(Long id);

    List<EmployeeResponse> getAll();

    EmployeeResponse updateEmployee(Long id, UpdateEmployeeRequest request);

    void deleteEmployee(Long id);

    // STATUS MANAGEMENT
    void activateEmployee(Long id);

    void deactivateEmployee(Long id);

    // AUTH SUPPORT
    Employee findByEmail(String email);

    EmployeeResponse updateProfile(UpdateProfileRequest request);

    void changePassword(Long id, ChangePasswordRequest request);
}