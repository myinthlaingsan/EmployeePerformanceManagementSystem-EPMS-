package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.org.AssignRoleRequest;
import ace.org.epms_backend.dto.org.RoleResponse;
import ace.org.epms_backend.service.EmployeeRoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees/{id}/roles")
@RequiredArgsConstructor
public class EmployeeRoleController {

    private final EmployeeRoleService employeeRoleService;

    @PostMapping
    public ResponseEntity<Void> assignRole(
            @PathVariable Long id, @Valid @RequestBody AssignRoleRequest request) {
        employeeRoleService.assignRoleToEmployee(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping
    public ResponseEntity<List<RoleResponse>> getRolesByEmployeeId(@PathVariable Long id) {
        return ResponseEntity.ok(employeeRoleService.getRolesByEmployeeId(id));
    }
}
