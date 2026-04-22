package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.appraisal.AppraisalFormRequest;
import ace.org.epms_backend.dto.appraisal.AppraisalFormResponse;
import ace.org.epms_backend.service.AppraisalFormService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/appraisal-forms")
@RequiredArgsConstructor
public class AppraisalFormController {

    private final AppraisalFormService appraisalFormService;

    @PostMapping
    public ResponseEntity<ApiResponse<AppraisalFormResponse>> create(@RequestBody AppraisalFormRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(appraisalFormService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AppraisalFormResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(appraisalFormService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AppraisalFormResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(appraisalFormService.getById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AppraisalFormResponse>> update(
            @PathVariable Long id,
            @RequestBody AppraisalFormRequest request) {
        return ResponseEntity.ok(ApiResponse.success(appraisalFormService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        appraisalFormService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
