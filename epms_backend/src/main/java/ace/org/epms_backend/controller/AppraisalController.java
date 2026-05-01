package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.appraisal.*;
import ace.org.epms_backend.service.AppraisalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AppraisalResponse>> create(
            @Valid @RequestBody AppraisalCreateRequest request
    ) {
        AppraisalResponse response = appraisalService.createAppraisal(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AppraisalResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(appraisalService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AppraisalResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(appraisalService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AppraisalResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody AppraisalUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(appraisalService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        appraisalService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AppraisalResponse>> assign(
            @Valid @RequestBody AppraisalAssignRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                appraisalService.assignAppraisal(request)
        ));
    }

    @PutMapping("/{id}/calculate")
    public ResponseEntity<ApiResponse<AppraisalResponse>> calculate(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                appraisalService.calculate(id)
        ));
    }

    @PutMapping("/{id}/lock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AppraisalResponse>> lock(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                appraisalService.lock(id)
        ));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse<List<AppraisalResponse>>> getByEmployeeId(@PathVariable Long employeeId) {
        return ResponseEntity.ok(ApiResponse.success(appraisalService.getByEmployeeId(employeeId)));
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<ApiResponse<List<AppraisalResponse>>> getByManagerId(@PathVariable Long managerId) {
        return ResponseEntity.ok(ApiResponse.success(appraisalService.getByManagerId(managerId)));
    }

    @GetMapping("/cycle/{cycleId}")
    public ResponseEntity<ApiResponse<List<AppraisalResponse>>> getByCycleId(@PathVariable Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(appraisalService.getByCycleId(cycleId)));
    }

    @PutMapping("/{id}/self-submit")
    public ResponseEntity<ApiResponse<AppraisalResponse>> submitSelfAssessment(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(appraisalService.submitSelfAssessment(id)));
    }

    @PutMapping("/{id}/manager-submit")
    public ResponseEntity<ApiResponse<AppraisalResponse>> submitManagerEvaluation(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(appraisalService.submitManagerEvaluation(id)));
    }

    @PutMapping("/{id}/employee-sign")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<ApiResponse<AppraisalResponse>> employeeSignOff(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(appraisalService.employeeSignOff(id)));
    }

    @PutMapping("/{id}/manager-sign")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AppraisalResponse>> managerSignOff(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(appraisalService.managerSignOff(id)));
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<ApiResponse<AppraisalDetailsResponse>> getDetails(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(appraisalService.getAppraisalDetails(id)));
    }
}
