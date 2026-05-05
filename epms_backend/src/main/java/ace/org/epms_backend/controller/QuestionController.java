package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.appraisal.QuestionRequest;
import ace.org.epms_backend.dto.appraisal.QuestionResponse;
import ace.org.epms_backend.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @PostMapping
    public ResponseEntity<ApiResponse<QuestionResponse>> create(@RequestBody QuestionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(questionService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> getAll(@RequestParam(required = false) Long categoryId) {
        return ResponseEntity.ok(ApiResponse.success(questionService.getByCategoryId(categoryId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuestionResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(questionService.getById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<QuestionResponse>> update(
            @PathVariable Long id,
            @RequestBody QuestionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(questionService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        questionService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
