package ace.org.epms_backend.controller.appraisal;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.appraisal.AppraisalFormSetRequest;
import ace.org.epms_backend.dto.appraisal.AppraisalFormSetResponse;
import ace.org.epms_backend.service.AppraisalFormSetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/appraisal-form-sets")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'HR')")
public class AppraisalFormSetController {

    private final AppraisalFormSetService formSetService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AppraisalFormSetResponse>>> getAllFormSets() {
        return ResponseEntity.ok(ApiResponse.success(formSetService.getAllFormSets()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AppraisalFormSetResponse>> createFormSet(
            @RequestBody AppraisalFormSetRequest request) {
        return ResponseEntity.ok(ApiResponse.success(formSetService.createFormSet(request)));
    }

    @GetMapping("/cycle/{cycleId}")
    public ResponseEntity<ApiResponse<List<AppraisalFormSetResponse>>> getByCycle(@PathVariable Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(formSetService.getByCycle(cycleId)));
    }

    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<String>> syncFormSets() {
        return ResponseEntity.ok(ApiResponse.success(formSetService.syncFormSets()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AppraisalFormSetResponse>> updateFormSet(@PathVariable Long id,
            @RequestBody AppraisalFormSetRequest request) {
        return ResponseEntity.ok(ApiResponse.success(formSetService.updateFormSet(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFormSet(@PathVariable Long id) {
        formSetService.deleteFormSet(id);
        return ResponseEntity.noContent().build();
    }
}
