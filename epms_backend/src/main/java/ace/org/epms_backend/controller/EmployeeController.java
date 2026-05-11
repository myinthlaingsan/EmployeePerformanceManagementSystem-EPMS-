package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.PagedResponse;
import ace.org.epms_backend.dto.employee.*;
import ace.org.epms_backend.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/emp")
@RequiredArgsConstructor
public class EmployeeController {
    private final EmployeeService employeeService;

    @PostMapping("/set-password")
    public ResponseEntity<ApiResponse<?>> setPassword(
            @RequestParam String token,
            @Valid @RequestBody SetPasswordRequest request
    ){
        employeeService.setPassword(token,request.getPassword());
        return ResponseEntity
                .ok(ApiResponse.success());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EmployeeResponse>> createEmployee(
            @Valid @RequestBody CreateEmployeeRequest request
    ) {
        EmployeeResponse response = employeeService.createEmployee(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success(employeeService.getById(id))
        );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<EmployeeResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(employeeService.getAllPaginated(page, size))
        );
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PagedResponse<EmployeeResponse>>> search(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long teamId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(employeeService.search(query, departmentId, teamId, page, size))
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEmployeeRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(employeeService.updateEmployee(id, request))
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.ok(ApiResponse.success());
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<?>> activateEmployee(@PathVariable Long id) {
        employeeService.activateEmployee(id);
        return ResponseEntity.ok(ApiResponse.success());
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<?>> deactivateEmployee(@PathVariable Long id) {
        employeeService.deactivateEmployee(id);
        return ResponseEntity.ok(ApiResponse.success());
    }

    @PutMapping("/me/profile")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(employeeService.updateProfile(request))
        );
    }

    @PostMapping("/{id}/change-password")
    public ResponseEntity<ApiResponse<?>> changePassword(
            @PathVariable Long id,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        employeeService.changePassword(id, request);
        return ResponseEntity.ok(ApiResponse.success());
    }

    @GetMapping("/{id}/direct-reports")
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getDirectReports(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success(employeeService.getDirectReports(id))
        );
    }

    @GetMapping("/{id}/manager")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getManager(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success(employeeService.getManager(id))
        );
    }

}
