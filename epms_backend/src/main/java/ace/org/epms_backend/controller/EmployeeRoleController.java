package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.employee.EmployeeResponse;
import ace.org.epms_backend.dto.org.AssignRoleRequest;
import ace.org.epms_backend.dto.org.RoleResponse;
import ace.org.epms_backend.service.EmployeeRoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/")
@RequiredArgsConstructor
public class EmployeeRoleController {

    private final EmployeeRoleService employeeRoleService;

    @PostMapping("/employees/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> assignRole(
            @PathVariable Long id, @Valid @RequestBody AssignRoleRequest request) {
        employeeRoleService.assignRoleToEmployee(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success());
    }

    @GetMapping("/employees/{id}/roles")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getRolesByEmployeeId(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(employeeRoleService.getRolesByEmployeeId(id)));
    }

    @DeleteMapping("/employees/{id}/roles/{roleId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> removeRole(
            @PathVariable Long id, @PathVariable Long roleId) {
        employeeRoleService.removeRoleFromEmployee(id, roleId);
        return ResponseEntity.ok(ApiResponse.success());
    }

    @GetMapping("/roles/{roleId}/employees")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getEmployeesByRole(@PathVariable Long roleId) {
        return ResponseEntity.ok(ApiResponse.success(employeeRoleService.getEmployeesByRoleId(roleId)));
    }
}
