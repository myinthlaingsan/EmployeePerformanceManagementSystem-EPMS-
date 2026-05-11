package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.appraisal.*;
import ace.org.epms_backend.service.ManagerEvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/manager-evaluations")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'HR')")
public class ManagerEvaluationController {

    private final ManagerEvaluationService service;

    @PostMapping
    public ResponseEntity<ApiResponse<ManagerEvaluationResponse>> create(@RequestBody ManagerEvaluationRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.create(request)));
    }

    @GetMapping("/form/{appraisalId}")
    public ResponseEntity<ApiResponse<FullManagerEvaluationResponse>> getEvaluationForm(@PathVariable Long appraisalId) {
        return ResponseEntity.ok(ApiResponse.success(service.getEvaluationForm(appraisalId)));
    }

    @GetMapping("/employee-view/{appraisalId}")
    public ResponseEntity<ApiResponse<EmployeeSelfAssessmentViewResponse>> getEmployeeView(@PathVariable Long appraisalId) {
        return ResponseEntity.ok(ApiResponse.success(service.getEmployeeView(appraisalId)));
    }

    @PostMapping("/{evaluationId}/answers")
    public ResponseEntity<ApiResponse<Void>> saveAnswers(
            @PathVariable Long evaluationId,
            @RequestBody List<ManagerEvaluationAnswerRequest> answers
    ) {
        service.saveAnswers(evaluationId, answers);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{evaluationId}/draft")
    public ResponseEntity<ApiResponse<Void>> saveDraft(
            @PathVariable Long evaluationId,
            @RequestParam(required = false) String finalComment
    ) {
        service.saveDraft(evaluationId, finalComment);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{evaluationId}/submit")
    public ResponseEntity<ApiResponse<Void>> submitFinal(@PathVariable Long evaluationId) {
        service.submitFinal(evaluationId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
