package ace.org.epms_backend.controller;
import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.appraisal.*;
import ace.org.epms_backend.service.AppraisalFormService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/appraisal-forms")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'HR')")
public class AppraisalFormController {

    private final AppraisalFormService formService;

    @PostMapping
    public ResponseEntity<ApiResponse<Long>> createForm(@RequestBody AppraisalFormRequest request) {
        return new ResponseEntity<>(ApiResponse.success(formService.createForm(request)), HttpStatus.CREATED);
    }

    @PostMapping("/{formId}/categories")
    public ResponseEntity<ApiResponse<Long>> addCategory(@PathVariable Long formId, @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(formService.addCategory(formId, request)));
    }

    @PostMapping("/categories/{categoryId}/questions")
    public ResponseEntity<ApiResponse<Long>> addQuestion(@PathVariable Long categoryId, @RequestBody QuestionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(formService.addQuestion(categoryId, request)));
    }

    @GetMapping("/{formId}")
    public ResponseEntity<ApiResponse<FullFormResponse>> getFullForm(@PathVariable Long formId) {
        return ResponseEntity.ok(ApiResponse.success(formService.getFullForm(formId)));
    }

    @PostMapping("/{formId}/clone")
    public ResponseEntity<ApiResponse<Long>> cloneForm(@PathVariable Long formId) {
        return ResponseEntity.ok(ApiResponse.success(formService.cloneForm(formId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AppraisalFormResponse>>> getAllForms() {
        return ResponseEntity.ok(ApiResponse.success(formService.getAllForms()));
    }
}

