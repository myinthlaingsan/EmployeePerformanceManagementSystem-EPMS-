package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.kpi.KpiCategoryRequest;
import ace.org.epms_backend.dto.kpi.KpiCategoryResponse;
import ace.org.epms_backend.service.KpiCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/kpi/categories")
@RequiredArgsConstructor
public class KpiCategoryController {

    private final KpiCategoryService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('HR','ADMIN')")
    public ResponseEntity<ApiResponse<KpiCategoryResponse>> create(
            @RequestBody @Valid KpiCategoryRequest request) {

        KpiCategoryResponse response = service.createCategory(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    // ✅ Get all
    @GetMapping
    public ResponseEntity<ApiResponse<List<KpiCategoryResponse>>> getAll() {
        return ResponseEntity.ok(
                ApiResponse.success(service.getAllCategories()));
    }

    // ✅ Get by ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<KpiCategoryResponse>> getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                ApiResponse.success(service.getCategoryById(id)));
    }

    // ✅ Update
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR','ADMIN')")
    public ResponseEntity<ApiResponse<KpiCategoryResponse>> update(
            @PathVariable Long id,
            @RequestBody KpiCategoryRequest request) {

        return ResponseEntity.ok(
                ApiResponse.success(service.updateCategory(id, request)));
    }

    // ✅ Delete
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> delete(@PathVariable Long id) {

        service.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully"));
    }
}
