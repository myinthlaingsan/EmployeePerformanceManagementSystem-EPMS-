package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.employee.SetPasswordRequest;
import ace.org.epms_backend.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
