package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.PagedResponse;
import ace.org.epms_backend.dto.employee.*;
import ace.org.epms_backend.model.employee.Employee;

import java.util.List;

public interface EmployeeService {
    EmployeeResponse createEmployee(CreateEmployeeRequest request);

    void setPassword(String token, String newPassword);

    // NEW - CORE CRUD
    EmployeeResponse getById(Long id);

    List<EmployeeResponse> getAll();

    PagedResponse<EmployeeResponse> getAllPaginated(int page, int size);

    PagedResponse<EmployeeResponse> search(String query, Long departmentId, Long teamId, int page, int size);

    EmployeeResponse updateEmployee(Long id, UpdateEmployeeRequest request);

    void deleteEmployee(Long id);

    // STATUS MANAGEMENT
    void activateEmployee(Long id);

    void deactivateEmployee(Long id);

    // HIERARCHY
    List<EmployeeResponse> getDirectReports(Long managerId);

    EmployeeResponse getManager(Long employeeId);

    // AUTH SUPPORT
    Employee findByEmail(String email);

    EmployeeResponse updateProfile(UpdateProfileRequest request);

    void uploadProfileImage(Long id, org.springframework.web.multipart.MultipartFile file);

    void changePassword(Long id, ChangePasswordRequest request);
}