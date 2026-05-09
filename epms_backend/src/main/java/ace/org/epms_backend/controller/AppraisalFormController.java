package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.appraisal.AppraisalFormRequest;
import ace.org.epms_backend.dto.appraisal.CategoryRequest;
import ace.org.epms_backend.dto.appraisal.FullFormResponse;
import ace.org.epms_backend.dto.appraisal.QuestionRequest;
import ace.org.epms_backend.service.AppraisalFormService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class AppraisalFormController {

    private final AppraisalFormService formService;

    @PostMapping("/api/v1/appraisal-forms")
    public ResponseEntity<Long> createForm(@RequestBody AppraisalFormRequest request) {
        return new ResponseEntity<>(formService.createForm(request), HttpStatus.CREATED);
    }

    @PostMapping("/api/v1/appraisal-forms/{formId}/categories")
    public ResponseEntity<Long> addCategory(@PathVariable Long formId, @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(formService.addCategory(formId, request));
    }

    @PostMapping("/api/v1/categories/{categoryId}/questions")
    public ResponseEntity<Long> addQuestion(@PathVariable Long categoryId, @RequestBody QuestionRequest request) {
        return ResponseEntity.ok(formService.addQuestion(categoryId, request));
    }

    @GetMapping("/api/v1/appraisal-forms/{formId}")
    public ResponseEntity<FullFormResponse> getFullForm(@PathVariable Long formId) {
        return ResponseEntity.ok(formService.getFullForm(formId));
    }

    @PostMapping("/api/v1/appraisal-forms/{formId}/clone")
    public ResponseEntity<Long> cloneForm(@PathVariable Long formId) {
        return ResponseEntity.ok(formService.cloneForm(formId));
    }
 
    @PutMapping("/api/v1/appraisal-forms/{formId}")
    public ResponseEntity<Void> updateForm(@PathVariable Long formId, @RequestBody AppraisalFormRequest request) {
        formService.updateForm(formId, request);
        return ResponseEntity.ok().build();
    }
 
    @PutMapping("/api/v1/categories/{categoryId}")
    public ResponseEntity<Void> updateCategory(@PathVariable Long categoryId, @RequestBody CategoryRequest request) {
        formService.updateCategory(categoryId, request);
        return ResponseEntity.ok().build();
    }
 
    @PutMapping("/api/v1/questions/{questionId}")
    public ResponseEntity<Void> updateQuestion(@PathVariable Long questionId, @RequestBody QuestionRequest request) {
        formService.updateQuestion(questionId, request);
        return ResponseEntity.ok().build();
    }
 
    @DeleteMapping("/api/v1/appraisal-forms/{formId}")
    public ResponseEntity<Void> deleteForm(@PathVariable Long formId) {
        formService.deleteForm(formId);
        return ResponseEntity.noContent().build();
    }
 
    @DeleteMapping("/api/v1/categories/{categoryId}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long categoryId) {
        formService.deleteCategory(categoryId);
        return ResponseEntity.noContent().build();
    }
 
    @DeleteMapping("/api/v1/questions/{questionId}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long questionId) {
        formService.deleteQuestion(questionId);
        return ResponseEntity.noContent().build();
    }
}