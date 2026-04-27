package ace.org.epms_backend.controller.feedback360;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.feedback360.FeedbackRequestResponse;
import ace.org.epms_backend.dto.feedback360.FeedbackSubmissionRequest;
import ace.org.epms_backend.model.UserPrincipal;
import ace.org.epms_backend.service.feedback360.FeedbackRequestService;
import ace.org.epms_backend.service.feedback360.FeedbackSubmissionService;
import ace.org.epms_backend.dto.feedback360.FeedbackSummaryResponse;
import ace.org.epms_backend.service.feedback360.FeedbackReportService;
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
    private final FeedbackReportService feedbackReportService;

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<?>> generateRequests(
            @RequestParam Long cycleId,
            @RequestParam(defaultValue = "2") int minPeers,
            @RequestParam(defaultValue = "3") int maxPeers,
            @RequestParam(defaultValue = "2") int minSubs,
            @RequestParam(defaultValue = "4") int maxSubs) {
        feedbackRequestService.generate360FeedbackRequests(cycleId, minPeers, maxPeers, minSubs, maxSubs);
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

    @GetMapping("/summary/{targetUserId}/{cycleId}")
    public ResponseEntity<ApiResponse<FeedbackSummaryResponse>> getFeedbackSummary(
            @PathVariable Long targetUserId,
            @PathVariable Long cycleId) {
        FeedbackSummaryResponse summary = feedbackReportService.getFeedbackSummary(targetUserId, cycleId);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
