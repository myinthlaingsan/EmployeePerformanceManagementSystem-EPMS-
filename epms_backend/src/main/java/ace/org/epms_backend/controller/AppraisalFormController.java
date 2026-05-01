package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.appraisal.form.AppraisalFormRequest;
import ace.org.epms_backend.dto.appraisal.form.CategoryRequest;
import ace.org.epms_backend.dto.appraisal.form.FullFormResponse;
import ace.org.epms_backend.dto.appraisal.form.QuestionRequest;
import ace.org.epms_backend.service.AppraisalFormService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/forms")
@RequiredArgsConstructor
public class AppraisalFormController {

    private final AppraisalFormService formService;

    @PostMapping
    public ResponseEntity<Long> createForm(@RequestBody AppraisalFormRequest request) {
        return new ResponseEntity<>(formService.createForm(request), HttpStatus.CREATED);
    }

    @PostMapping("/{formId}/categories")
    public ResponseEntity<Void> addCategory(@PathVariable Long formId, @RequestBody CategoryRequest request) {
        formService.addCategory(formId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/categories/{categoryId}/questions")
    public ResponseEntity<Void> addQuestion(@PathVariable Long categoryId, @RequestBody QuestionRequest request) {
        formService.addQuestion(categoryId, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{formId}/full")
    public ResponseEntity<FullFormResponse> getFullForm(@PathVariable Long formId) {
        return ResponseEntity.ok(formService.getFullForm(formId));
    }

    @PutMapping("/{formId}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable Long formId, @RequestParam Boolean isActive) {
        formService.updateFormStatus(formId, isActive);
        return ResponseEntity.ok().build();
    }
}
