package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.appraisal.AppraisalCycleRequest;
import ace.org.epms_backend.dto.appraisal.AppraisalCycleResponse;
import ace.org.epms_backend.service.AppraisalCycleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/appraisal-cycles")
@RequiredArgsConstructor
public class AppraisalCycleController {

    private final AppraisalCycleService appraisalCycleService;

    @PostMapping
    public ResponseEntity<ApiResponse<AppraisalCycleResponse>> create(@Valid @RequestBody AppraisalCycleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(appraisalCycleService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AppraisalCycleResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(appraisalCycleService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AppraisalCycleResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(appraisalCycleService.getById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AppraisalCycleResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody AppraisalCycleRequest request) {
        return ResponseEntity.ok(ApiResponse.success(appraisalCycleService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        appraisalCycleService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<AppraisalCycleResponse>> activate(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(appraisalCycleService.activate(id)));
    }

    @PutMapping("/{id}/advance-to-evaluation")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<AppraisalCycleResponse>> advanceToEvaluation(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(appraisalCycleService.advanceToEvaluation(id)));
    }

    @PutMapping("/{id}/close")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AppraisalCycleResponse>> close(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(appraisalCycleService.close(id)));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<AppraisalCycleResponse>> getActiveCycle() {
        return ResponseEntity.ok(ApiResponse.success(appraisalCycleService.getActiveCycle()));
    }
}
