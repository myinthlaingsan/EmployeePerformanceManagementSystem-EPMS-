package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.continuous.FeedbackTagRequest;
import ace.org.epms_backend.dto.continuous.FeedbackTagResponse;
import ace.org.epms_backend.service.FeedbackTagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tags")
@RequiredArgsConstructor
public class FeedbackTagController {

    private final FeedbackTagService tagService;

    @PostMapping
    public ResponseEntity<ApiResponse<FeedbackTagResponse>> createTag(@Valid @RequestBody FeedbackTagRequest request) {
        FeedbackTagResponse response = tagService.createTag(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FeedbackTagResponse>>> getAllTags() {
        List<FeedbackTagResponse> responses = tagService.getAllTags();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PutMapping("/{tagId}")
    public ResponseEntity<ApiResponse<FeedbackTagResponse>> updateTag(
            @PathVariable Long tagId,
            @Valid @RequestBody FeedbackTagRequest request) {
        FeedbackTagResponse response = tagService.updateTag(tagId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{tagId}")
    public ResponseEntity<ApiResponse<Void>> deleteTag(@PathVariable Long tagId) {
        tagService.deleteTag(tagId);
        return ResponseEntity.ok(ApiResponse.success());
    }
}
