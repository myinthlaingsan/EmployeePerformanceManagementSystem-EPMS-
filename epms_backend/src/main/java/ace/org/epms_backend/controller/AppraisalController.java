package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.appraisal.*;
import ace.org.epms_backend.model.appraisal.Appraisal;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.repository.AppraisalRepository;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.service.AppraisalService;
import ace.org.epms_backend.service.appraisal.AppraisalIntegrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
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
    private final AppraisalIntegrationService appraisalIntegrationService;

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

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AppraisalResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(appraisalService.getById(id)));
    }

    @PostMapping("/{id}/calculate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<ScoreBreakdownResponse>> calculate(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                appraisalService.calculate(id)
        ));
    }

    @GetMapping("/{id}/score-breakdown")
    public ResponseEntity<ApiResponse<ScoreBreakdownResponse>> getScoreBreakdown(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                appraisalService.getScoreBreakdown(id)
        ));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<AppraisalResponse>> approve(
            @PathVariable Long id,
            @RequestParam(required = false) String comment
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                appraisalService.approve(id, comment)
        ));
    }

    @PostMapping("/{id}/finalize")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
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

    @GetMapping("/cycle/{cycleId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<List<AppraisalResponse>>> getByCycleId(@PathVariable Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(appraisalService.getByCycleId(cycleId)));
    }

    @PostMapping(value = "/{id}/employee-signature", consumes = "multipart/form-data")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> uploadEmployeeSignature(
            @PathVariable("id") Long id,
            @RequestParam("file") MultipartFile file
    ) {
        appraisalService.uploadEmployeeSignature(id, file);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping(value = "/{id}/manager-signature", consumes = "multipart/form-data")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> uploadManagerSignature(
            @PathVariable("id") Long id,
            @RequestParam("file") MultipartFile file
    ) {
        appraisalService.uploadManagerSignature(id, file);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // Merged from AppraisalIntegrationController to resolve conflict
    @PostMapping("/sync-feedback")
    public ResponseEntity<Void> syncFeedback(@Valid @RequestBody AppraisalSyncRequest request) {
        appraisalIntegrationService.syncFeedbackToAppraisal(request.getCycleId());
        return ResponseEntity.ok().build();
    }


    @GetMapping("/employee/{employeeId}/cycle/{cycleId}")
    public ResponseEntity<Appraisal> getAppraisalIntegration(@PathVariable Long employeeId, @PathVariable Long cycleId) {
        return ResponseEntity.ok(appraisalIntegrationService.getAppraisal(employeeId, cycleId));
    }

    @PutMapping("/{appraisalId}/score")
    public ResponseEntity<Void> updateScore(@PathVariable Long appraisalId, @RequestParam BigDecimal score) {
        appraisalIntegrationService.updateFormScore(appraisalId, score);
        return ResponseEntity.ok().build();
    }
}



