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
@PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
public class SelfAssessmentController {

    private final SelfAssessmentService service;

    @PostMapping
    public ResponseEntity<ApiResponse<SelfAssessmentResponse>> create(
            @RequestBody SelfAssessmentRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                service.create(request)
        ));
    }

    @PostMapping("/{id}/answers")
    public ResponseEntity<ApiResponse<Void>> saveAnswers(
            @PathVariable Long id,
            @RequestBody List<SelfAssessmentAnswerRequest> request
    ) {
        service.saveAnswers(id, request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/{id}/answers")
    public ResponseEntity<ApiResponse<List<SelfAssessmentAnswerResponse>>> getAnswers(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                service.getAnswers(id)
        ));
    }

    @PutMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<Void>> submitFinal(
            @PathVariable Long id
    ) {
        service.submitFinal(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
