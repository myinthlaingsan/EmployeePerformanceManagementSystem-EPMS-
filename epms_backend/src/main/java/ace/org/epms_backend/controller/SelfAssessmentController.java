package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.appraisal.*;
import ace.org.epms_backend.service.SelfAssessmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/self-assessments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN', 'HR')")
public class SelfAssessmentController {

    private final SelfAssessmentService service;

    @GetMapping("/form/{appraisalId}")
    public ResponseEntity<ApiResponse<FullSelfAssessmentResponse>> getMyAssessmentForm(@PathVariable Long appraisalId) {
        return ResponseEntity.ok(ApiResponse.success(service.getMyAssessmentForm(appraisalId)));
    }

    @PostMapping("/{selfAssessmentId}/answers")
    public ResponseEntity<ApiResponse<Void>> saveAnswers(
            @PathVariable Long selfAssessmentId,
            @RequestBody List<SelfAssessmentAnswerRequest> answers
    ) {
        service.saveAnswers(selfAssessmentId, answers);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{selfAssessmentId}/draft")
    public ResponseEntity<ApiResponse<Void>> saveDraft(
            @PathVariable Long selfAssessmentId,
            @RequestParam(required = false) String overallReflection
    ) {
        service.saveDraft(selfAssessmentId, overallReflection);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{selfAssessmentId}/submit")
    public ResponseEntity<ApiResponse<Void>> submitFinal(@PathVariable Long selfAssessmentId) {
        service.submitFinal(selfAssessmentId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse<List<SelfAssessmentResponse>>> getMyAssessments(@PathVariable Long employeeId) {
        return ResponseEntity.ok(ApiResponse.success(service.getMyAssessments(employeeId)));
    }
}
