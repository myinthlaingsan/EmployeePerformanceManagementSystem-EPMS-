package ace.org.epms_backend.controller.feedback360;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.feedback360.FeedbackRequestResponse;
import ace.org.epms_backend.dto.feedback360.FeedbackSubmissionRequest;
import ace.org.epms_backend.model.UserPrincipal;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.repository.appraisal.AppraisalCycleRepository;
import ace.org.epms_backend.service.feedback360.FeedbackRequestService;
import ace.org.epms_backend.service.feedback360.FeedbackSubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/feedback")
@RequiredArgsConstructor
public class Feedback360Controller {

    private final FeedbackRequestService feedbackRequestService;
    private final FeedbackSubmissionService feedbackSubmissionService;
    private final AppraisalCycleRepository appraisalCycleRepository;

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<?>> generateRequests(@RequestParam Long cycleId) {
        AppraisalCycle cycle = appraisalCycleRepository.findById(cycleId)
                .orElseThrow(() -> new RuntimeException("Appraisal cycle not found"));
        feedbackRequestService.generate360FeedbackRequests(cycle);
        return ResponseEntity.ok(ApiResponse.success("Feedback requests generated successfully"));
    }

    @GetMapping("/my-requests")
    public ResponseEntity<ApiResponse<List<FeedbackRequestResponse>>> getMyRequests(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<FeedbackRequestResponse> requests = feedbackRequestService.getMyPendingRequests(principal.getEmployee().getId());
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<?>> submitFeedback(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody FeedbackSubmissionRequest request) {
        feedbackSubmissionService.submitFeedback(request, principal.getEmployee().getId());
        return ResponseEntity.ok(ApiResponse.success("Feedback submitted successfully"));
    }
}
