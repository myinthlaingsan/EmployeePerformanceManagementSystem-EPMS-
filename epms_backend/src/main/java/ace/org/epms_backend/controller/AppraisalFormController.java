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
    public ResponseEntity<Void> addCategory(@PathVariable Long formId, @RequestBody CategoryRequest request) {
        formService.addCategory(formId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/v1/categories/{categoryId}/questions")
    public ResponseEntity<Void> addQuestion(@PathVariable Long categoryId, @RequestBody QuestionRequest request) {
        formService.addQuestion(categoryId, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/api/v1/appraisal-forms/{formId}")
    public ResponseEntity<FullFormResponse> getFullForm(@PathVariable Long formId) {
        return ResponseEntity.ok(formService.getFullForm(formId));
    }

    @PostMapping("/api/v1/appraisal-forms/{formId}/clone")
    public ResponseEntity<Long> cloneForm(@PathVariable Long formId) {
        return ResponseEntity.ok(formService.cloneForm(formId));
    }
}

