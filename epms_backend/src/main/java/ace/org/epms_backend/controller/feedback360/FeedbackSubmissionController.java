package ace.org.epms_backend.controller.feedback360;

import ace.org.epms_backend.dto.feedback360.FeedbackDetailsResponse;
import ace.org.epms_backend.dto.feedback360.FeedbackSubmissionRequest;
import ace.org.epms_backend.service.feedback360.FeedbackSubmissionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/360-feedback/feedbacks")
@RequiredArgsConstructor
@Tag(name = "360 Feedback Submission", description = "Endpoints for submitting and managing 360 feedback responses")
public class FeedbackSubmissionController {

    private final FeedbackSubmissionService feedbackService;

    @PostMapping
    public ResponseEntity<Void> submitFeedback(@RequestBody FeedbackSubmissionRequest request, @RequestParam Long evaluatorId) {
        feedbackService.submitFeedback(request, evaluatorId);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

    @GetMapping("/request/{requestId}")
    public ResponseEntity<FeedbackDetailsResponse> getByRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(feedbackService.getFeedbackByRequest(requestId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<FeedbackDetailsResponse>> getMySubmitted(@RequestParam Long evaluatorId) {
        return ResponseEntity.ok(feedbackService.getMySubmittedFeedbacks(evaluatorId));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<FeedbackDetailsResponse>> getReceivedByEmployee(@PathVariable Long employeeId, @RequestParam Long cycleId) {
        return ResponseEntity.ok(feedbackService.getFeedbackReceivedByEmployee(employeeId, cycleId));
    }

    @DeleteMapping("/{feedbackId}")
    public ResponseEntity<Void> deleteFeedback(@PathVariable Long feedbackId) {
        feedbackService.deleteFeedback(feedbackId);
        return ResponseEntity.noContent().build();
    }
}
