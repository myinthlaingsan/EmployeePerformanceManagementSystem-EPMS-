package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
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
            @RequestBody SetPasswordRequest request
    ){
        employeeService.setPassword(token,request.getPassword());
        return ResponseEntity
                .ok(ApiResponse.success());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EmployeeResponse>> createEmployee(
            @RequestBody CreateEmployeeRequest request
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
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getAll() {
        return ResponseEntity.ok(
                ApiResponse.success(employeeService.getAll())
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateEmployee(
            @PathVariable Long id,
            @RequestBody UpdateEmployeeRequest request
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
            @RequestBody ChangePasswordRequest request
    ) {
        employeeService.changePassword(id, request);
        return ResponseEntity.ok(ApiResponse.success());
    }

}
