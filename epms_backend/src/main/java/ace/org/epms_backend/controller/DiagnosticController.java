package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.model.appraisal.Appraisal;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.repository.AppraisalRepository;
import ace.org.epms_backend.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/diagnostics")
@RequiredArgsConstructor
public class DiagnosticController {

    private final EmployeeRepository employeeRepo;
    private final AppraisalRepository appraisalRepo;

    @GetMapping("/appraisal-health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkHealth() {
        Map<String, Object> report = new HashMap<>();
        
        // 1. Check Security Context
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        report.put("currentUserEmail", email);
        
        // 2. Check Employee Record
        Employee employee = employeeRepo.findByEmail(email).orElse(null);
        report.put("employeeRecordFound", employee != null);
        
        if (employee != null) {
            report.put("employeeId", employee.getId());
            report.put("staffName", employee.getStaffName());
            
            // 3. Check Appraisals
            List<Appraisal> appraisals = appraisalRepo.findByEmployee_Id(employee.getId());
            report.put("appraisalCount", appraisals.size());
            
            if (!appraisals.isEmpty()) {
                Map<String, Object> firstAppraisal = new HashMap<>();
                Appraisal a = appraisals.get(0);
                firstAppraisal.put("id", a.getAppraisalId());
                firstAppraisal.put("status", a.getStatus());
                firstAppraisal.put("cycleId", a.getCycle() != null ? a.getCycle().getCycleId() : "NULL");
                
                if (a.getCycle() != null) {
                    firstAppraisal.put("cycleName", a.getCycle().getCycleName());
                    firstAppraisal.put("formCount", a.getCycle().getForms() != null ? a.getCycle().getForms().size() : 0);
                    
                    boolean hasSelfForm = a.getCycle().getForms().stream()
                            .anyMatch(f -> f.getFormType().name().equals("SELF_ASSESSMENT"));
                    firstAppraisal.put("hasSelfAssessmentForm", hasSelfForm);
                }
                
                report.put("firstAppraisalDetails", firstAppraisal);
            }
        }
        
        return ResponseEntity.ok(ApiResponse.success(report));
    }
}
