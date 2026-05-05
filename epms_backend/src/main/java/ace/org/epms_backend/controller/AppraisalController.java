package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.appraisal.AppraisalAssignRequest;
import ace.org.epms_backend.dto.appraisal.AppraisalBulkAssignRequest;
import ace.org.epms_backend.dto.appraisal.AppraisalResponse;
import ace.org.epms_backend.dto.appraisal.ScoreBreakdownResponse;
import ace.org.epms_backend.service.AppraisalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/v1/appraisals")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
public class AppraisalController {

    private final AppraisalService appraisalService;

    @PostMapping("/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AppraisalResponse>> assign(
            @Valid @RequestBody AppraisalAssignRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                appraisalService.assignAppraisal(request)
        ));
    }

    @PostMapping("/assign/bulk")
    @PreAuthorize("hasRole('ADMIN')")
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
}



