package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.appraisal.*;
import ace.org.epms_backend.model.appraisal.Appraisal;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.repository.AppraisalRepository;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.service.AppraisalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/v1/appraisals")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE', 'HR')")
public class AppraisalController {

    private final AppraisalService appraisalService;
    private final EmployeeRepository employeeRepo;
    private final AppraisalRepository appraisalRepo;

    @GetMapping("/diagnostics/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkHealth() {
        Map<String, Object> report = new HashMap<>();
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        report.put("currentUserEmail", email);
        
        Employee employee = employeeRepo.findByEmail(email).orElse(null);
        report.put("employeeRecordFound", employee != null);
        
        if (employee != null) {
            report.put("employeeId", employee.getId());
            report.put("staffName", employee.getStaffName());
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

    @PostMapping("/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<AppraisalResponse>> assign(
            @Valid @RequestBody AppraisalAssignRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                appraisalService.assignAppraisal(request)
        ));
    }

    @PostMapping("/assign/bulk")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<List<AppraisalResponse>>> assignBulk(
            @Valid @RequestBody AppraisalBulkAssignRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                appraisalService.assignBulk(request)
        ));
    }

    @GetMapping("/my-assessments")
    public ResponseEntity<ApiResponse<List<AppraisalResponse>>> getMyAssessments() {
        return ResponseEntity.ok(ApiResponse.success(
                appraisalService.getMyAssessments()
        ));
    }

    @GetMapping("/team-evaluations")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AppraisalResponse>>> getTeamEvaluations() {
        return ResponseEntity.ok(ApiResponse.success(
                appraisalService.getTeamEvaluations()
        ));
    }
 
    @GetMapping("/department-assessments")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<List<AppraisalResponse>>> getDepartmentAppraisals() {
        return ResponseEntity.ok(ApiResponse.success(
                appraisalService.getDepartmentAppraisals()
        ));
    }
 
    @GetMapping("/to-evaluate")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AppraisalResponse>>> getAppraisalsToEvaluate() {
        return ResponseEntity.ok(ApiResponse.success(
                appraisalService.getAppraisalsToEvaluate()
        ));
    }
 
    @GetMapping("/employee-view/{appraisalId}")
    public ResponseEntity<ApiResponse<EmployeeSelfAssessmentViewResponse>> getEmployeeView(@PathVariable Long appraisalId) {
        return ResponseEntity.ok(ApiResponse.success(appraisalService.getEmployeeView(appraisalId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AppraisalResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(appraisalService.getById(id)));
    }

    @PostMapping("/{id}/calculate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ScoreBreakdownResponse>> calculate(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                appraisalService.calculate(id)
        ));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AppraisalResponse>> approve(
            @PathVariable Long id,
            @RequestParam(required = false) String comment
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                appraisalService.approve(id, comment)
        ));
    }

    @PostMapping("/{id}/finalize")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AppraisalResponse>> finalizeAppraisal(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                appraisalService.finalizeAppraisal(id)
        ));
    }

    @PostMapping("/{id}/employee-sign-off")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<AppraisalResponse>> employeeSignOff(
            @PathVariable Long id,
            @RequestParam(required = false) String comment
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                appraisalService.employeeSignOff(id, comment)
        ));
    }

    @PostMapping("/{id}/manager-sign-off")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AppraisalResponse>> managerSignOff(
            @PathVariable Long id,
            @RequestParam(required = false) String comment
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                appraisalService.managerSignOff(id, comment)
        ));
    }
 
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        appraisalService.deleteAppraisal(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}



