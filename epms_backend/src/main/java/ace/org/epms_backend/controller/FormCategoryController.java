package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.appraisal.FormCategoryRequest;
import ace.org.epms_backend.dto.appraisal.FormCategoryResponse;
import ace.org.epms_backend.service.FormCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class FormCategoryController {

    private final FormCategoryService formCategoryService;

    @PostMapping
    public ResponseEntity<ApiResponse<FormCategoryResponse>> create(@RequestBody FormCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(formCategoryService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FormCategoryResponse>>> getAll(@RequestParam(required = false) Long formId) {
        return ResponseEntity.ok(ApiResponse.success(formCategoryService.getByFormId(formId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FormCategoryResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(formCategoryService.getById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FormCategoryResponse>> update(
            @PathVariable Long id,
            @RequestBody FormCategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(formCategoryService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        formCategoryService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
