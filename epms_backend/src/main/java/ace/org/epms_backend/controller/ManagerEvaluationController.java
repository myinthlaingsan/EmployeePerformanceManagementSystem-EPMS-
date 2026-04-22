package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.appraisal.ManagerEvaluationRequest;
import ace.org.epms_backend.service.ManagerEvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/manager-evaluations")
@RequiredArgsConstructor
public class ManagerEvaluationController {

    private final ManagerEvaluationService service;

    @PostMapping
    public ResponseEntity<ApiResponse<ManagerEvaluationResponse>> submit(
            @RequestBody ManagerEvaluationRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                service.submitEvaluation(request)
        ));
    }
}

