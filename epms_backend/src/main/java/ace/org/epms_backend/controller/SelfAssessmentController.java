package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.appraisal.SelfAssessmentSubmitRequest;
import ace.org.epms_backend.service.SelfAssessmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/self-assessments")
@RequiredArgsConstructor
public class SelfAssessmentController {

    private final SelfAssessmentService service;

    @PostMapping
    public ResponseEntity<ApiResponse<SelfAssessmentResponse>> create(
            @RequestBody SelfAssessmentSubmitRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                service.submitSelfAssessment(request)
        ));
    }
}
