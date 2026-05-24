package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.model.appraisal.Appraisal;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.repository.AppraisalRepository;
import ace.org.epms_backend.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/public-diagnostics")
@RequiredArgsConstructor
public class PublicDiagnosticController {

    private final EmployeeRepository employeeRepo;
    private final AppraisalRepository appraisalRepo;

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkHealth() {
        Map<String, Object> report = new HashMap<>();
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        report.put("currentUserEmail", email);
        report.put("authorities", auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()));
        
        Employee employee = employeeRepo.findByEmail(email).orElse(null);
        report.put("employeeRecordFound", employee != null);
        
        if (employee != null) {
            report.put("employeeId", employee.getId());
            report.put("staffName", employee.getStaffName());
            List<Appraisal> appraisals = appraisalRepo.findByEmployee_Id(employee.getId());
            report.put("appraisalCount", appraisals.size());
        }
        
        return ResponseEntity.ok(ApiResponse.success(report));
    }
}
