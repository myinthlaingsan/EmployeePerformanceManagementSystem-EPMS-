package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.appraisal.AppraisalAssignRequest;
import ace.org.epms_backend.dto.appraisal.AppraisalCreateRequest;
import ace.org.epms_backend.dto.appraisal.AppraisalResponse;
import ace.org.epms_backend.service.AppraisalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/appraisals")
@RequiredArgsConstructor
public class AppraisalController {

    private final AppraisalService appraisalService;

    @PostMapping
    public ResponseEntity<ApiResponse<AppraisalResponse>> create(
            @RequestBody AppraisalCreateRequest request
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

    @PostMapping("/assign")
    public ResponseEntity<ApiResponse<AppraisalResponse>> assign(
            @RequestBody AppraisalAssignRequest request
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
    public ResponseEntity<ApiResponse<AppraisalResponse>> lock(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                appraisalService.lock(id)
        ));
    }
}
