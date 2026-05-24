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
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/appraisal-forms")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'HR')")
public class AppraisalFormController {

    private final AppraisalFormService formService;

    @PostMapping
    public ResponseEntity<ApiResponse<Long>> createForm(@Valid @RequestBody AppraisalFormRequest request) {
        return new ResponseEntity<>(ApiResponse.success(formService.createForm(request)), HttpStatus.CREATED);
    }

    @PostMapping("/{formId}/categories")
    public ResponseEntity<ApiResponse<Long>> addCategory(@PathVariable Long formId, @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(formService.addCategory(formId, request)));
    }

    @PostMapping("/categories/{categoryId}/questions")
    public ResponseEntity<ApiResponse<Long>> addQuestion(@PathVariable Long categoryId, @Valid @RequestBody QuestionRequest request) {
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

    @GetMapping("/feedback-forms")
    public ResponseEntity<ApiResponse<List<AppraisalFormResponse>>> getFeedbackFormsByCycle(
            @RequestParam Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(formService.getFeedbackFormsByCycle(cycleId)));
    }
 
    @PutMapping("/{formId}")
    public ResponseEntity<Void> updateForm(@PathVariable Long formId, @Valid @RequestBody AppraisalFormRequest request) {
        formService.updateForm(formId, request);
        return ResponseEntity.ok().build();
    }
 
    @PutMapping("/categories/{categoryId}")
    public ResponseEntity<Void> updateCategory(@PathVariable Long categoryId, @Valid @RequestBody CategoryRequest request) {
        formService.updateCategory(categoryId, request);
        return ResponseEntity.ok().build();
    }
 
    @PutMapping("/questions/{questionId}")
    public ResponseEntity<Void> updateQuestion(@PathVariable Long questionId, @Valid @RequestBody QuestionRequest request) {
        formService.updateQuestion(questionId, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{formId}")
    public ResponseEntity<Void> deleteForm(@PathVariable Long formId) {
        formService.deleteForm(formId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/categories/{categoryId}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long categoryId) {
        formService.deleteCategory(categoryId);
        return ResponseEntity.noContent().build();
    }
 
    @DeleteMapping("/questions/{questionId}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long questionId) {
        formService.deleteQuestion(questionId);
        return ResponseEntity.noContent().build();
    }
}