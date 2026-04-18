package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.org.AssignDepartmentRequest;
import ace.org.epms_backend.dto.org.EmployeeDepartmentResponse;
import ace.org.epms_backend.service.EmployeeDepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/employees/{id}/departments")
@RequiredArgsConstructor
public class EmployeeDepartmentController {

    private final EmployeeDepartmentService employeeDepartmentService;

    @PostMapping
    public ResponseEntity<EmployeeDepartmentResponse> assignDepartment(
            @PathVariable Long id, @Valid @RequestBody AssignDepartmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeeDepartmentService.assignDepartment(id, request));
    }

    @GetMapping
    public ResponseEntity<List<EmployeeDepartmentResponse>> getDepartmentHistory(@PathVariable Long id) {
        return ResponseEntity.ok(employeeDepartmentService.getEmployeeDepartmentHistory(id));
    }
}
