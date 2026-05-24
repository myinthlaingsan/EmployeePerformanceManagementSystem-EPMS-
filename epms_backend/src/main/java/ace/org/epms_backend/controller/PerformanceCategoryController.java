package ace.org.epms_backend.controller;
 
import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.appraisal.PerformanceCategoryRequest;
import ace.org.epms_backend.dto.appraisal.PerformanceCategoryResponse;
import ace.org.epms_backend.service.PerformanceCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
 
import jakarta.validation.Valid;
import java.util.List;
 
@RestController
@RequestMapping("/api/v1/performance-categories")
@RequiredArgsConstructor
public class PerformanceCategoryController {

    private final PerformanceCategoryService service;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PerformanceCategoryResponse>> create(@Valid @RequestBody PerformanceCategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PerformanceCategoryResponse>> update(@PathVariable Long id, @Valid @RequestBody PerformanceCategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PerformanceCategoryResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PerformanceCategoryResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }
}
