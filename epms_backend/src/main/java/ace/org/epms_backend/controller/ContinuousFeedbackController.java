package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.continuous.ContinuousFeedbackRequest;
import ace.org.epms_backend.dto.continuous.ContinuousFeedbackResponse;
import ace.org.epms_backend.dto.continuous.FeedbackReplyRequest;
import ace.org.epms_backend.dto.continuous.FeedbackReplyResponse;
import ace.org.epms_backend.service.ContinuousFeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ContinuousFeedbackController {

    private final ContinuousFeedbackService feedbackService;

    // --- CONTINUOUS FEEDBACK APIs ---
    
    @GetMapping("/feedbacks")
    public ResponseEntity<ApiResponse<List<ContinuousFeedbackResponse>>> getAllFeedbacks() {
        List<ContinuousFeedbackResponse> responses = feedbackService.getAllFeedbacks();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PostMapping("/feedbacks")
    public ResponseEntity<ApiResponse<ContinuousFeedbackResponse>> createFeedback(
            @Valid @RequestBody ContinuousFeedbackRequest request) {
        ContinuousFeedbackResponse response = feedbackService.createFeedback(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @GetMapping("/feedbacks/{feedbackId}")
    public ResponseEntity<ApiResponse<ContinuousFeedbackResponse>> getFeedbackById(
            @PathVariable Long feedbackId) {
        ContinuousFeedbackResponse response = feedbackService.getFeedbackById(feedbackId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/feedbacks/employee/{employeeId}")
    public ResponseEntity<ApiResponse<List<ContinuousFeedbackResponse>>> getFeedbacksByEmployee(
            @PathVariable Long employeeId) {
        List<ContinuousFeedbackResponse> responses = feedbackService.getFeedbacksByEmployee(employeeId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/feedbacks/manager/{managerId}")
    public ResponseEntity<ApiResponse<List<ContinuousFeedbackResponse>>> getFeedbacksByManager(
            @PathVariable Long managerId) {
        List<ContinuousFeedbackResponse> responses = feedbackService.getFeedbacksByManager(managerId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PutMapping("/feedbacks/{feedbackId}")
    public ResponseEntity<ApiResponse<ContinuousFeedbackResponse>> updateFeedback(
            @PathVariable Long feedbackId,
            @Valid @RequestBody ContinuousFeedbackRequest request) {
        ContinuousFeedbackResponse response = feedbackService.updateFeedback(feedbackId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/feedbacks/{feedbackId}")
    public ResponseEntity<ApiResponse<Void>> deleteFeedback(@PathVariable Long feedbackId) {
        feedbackService.deleteFeedback(feedbackId);
        return ResponseEntity.ok(ApiResponse.success());
    }

    // --- FEEDBACK REPLY APIs ---

    @PostMapping("/feedbacks/{feedbackId}/replies")
    public ResponseEntity<ApiResponse<FeedbackReplyResponse>> replyToFeedback(
            @PathVariable Long feedbackId,
            @Valid @RequestBody FeedbackReplyRequest request) {
        FeedbackReplyResponse response = feedbackService.replyToFeedback(feedbackId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @GetMapping("/feedbacks/{feedbackId}/replies")
    public ResponseEntity<ApiResponse<List<FeedbackReplyResponse>>> getRepliesForFeedback(
            @PathVariable Long feedbackId) {
        List<FeedbackReplyResponse> responses = feedbackService.getRepliesForFeedback(feedbackId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @DeleteMapping("/replies/{replyId}")
    public ResponseEntity<ApiResponse<Void>> deleteReply(@PathVariable Long replyId) {
        feedbackService.deleteReply(replyId);
        return ResponseEntity.ok(ApiResponse.success());
    }
}
