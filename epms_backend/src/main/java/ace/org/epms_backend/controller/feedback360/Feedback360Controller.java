package ace.org.epms_backend.controller.feedback360;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.feedback360.EvaluatorAssignmentDTO;
import ace.org.epms_backend.dto.feedback360.FeedbackRequestResponse;
import ace.org.epms_backend.dto.feedback360.FeedbackSubmissionRequest;
import ace.org.epms_backend.dto.feedback360.FeedbackSummaryResponse;
import ace.org.epms_backend.model.UserPrincipal;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.service.feedback360.EvaluatorRotationService;
import ace.org.epms_backend.service.feedback360.FeedbackReportService;
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

    private final FeedbackRequestService    feedbackRequestService;
    private final FeedbackSubmissionService feedbackSubmissionService;
    private final FeedbackReportService     feedbackReportService;
    private final EvaluatorRotationService  evaluatorRotationService;

    // ─────────────────────────────────────────────────────────────────────────
    // Existing Endpoints
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/generate")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<ApiResponse<?>> generateRequests(
            @RequestParam Long cycleId,
            @RequestParam(required = false) Long previousCycleId,
            @RequestParam(defaultValue = "7") int globalMaxLimit,
            @RequestParam(defaultValue = "true") boolean excludeLongTermLeave) {
        feedbackRequestService.generate360FeedbackRequests(cycleId, previousCycleId, globalMaxLimit, excludeLongTermLeave);
        return ResponseEntity.ok(ApiResponse.success("Enhanced feedback requests generated successfully with workload control."));
    }

    @GetMapping("/preview")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<ApiResponse<List<FeedbackRequestResponse>>> preview360Requests(
            @RequestParam Long cycleId,
            @RequestParam(required = false) Long previousCycleId,
            @RequestParam(defaultValue = "7") int globalMaxLimit,
            @RequestParam(defaultValue = "true") boolean excludeLongTermLeave) {
        List<FeedbackRequestResponse> preview = feedbackRequestService.preview360FeedbackRequests(cycleId, previousCycleId, globalMaxLimit, excludeLongTermLeave);
        return ResponseEntity.ok(ApiResponse.success(preview));
    }

    @PostMapping("/regenerate-user")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<ApiResponse<?>> regenerateUserRequests(
            @RequestParam Long targetEmployeeId,
            @RequestParam Long cycleId,
            @RequestParam(required = false) Long previousCycleId,
            @RequestParam(defaultValue = "7") int globalMaxLimit) {
        feedbackRequestService.regenerateUserFeedbackRequests(targetEmployeeId, cycleId, previousCycleId, globalMaxLimit);
        return ResponseEntity.ok(ApiResponse.success("Feedback requests for employee " + targetEmployeeId + " regenerated successfully."));
    }

    @GetMapping("/my-requests")
    public ResponseEntity<ApiResponse<List<FeedbackRequestResponse>>> getMyRequests(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<FeedbackRequestResponse> requests =
                feedbackRequestService.getMyPendingRequests(principal.getEmployee().getId());
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

    @GetMapping("/requests/{requestId}")
    public ResponseEntity<ApiResponse<FeedbackRequestResponse>> getRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(ApiResponse.success(feedbackRequestService.getRequest(requestId)));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Evaluator Rotation Rule Endpoints  (L01-L03 → L04 Top Management Logic)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * [POST] /api/v1/feedback/rotation/generate
     * <p>
     * Applies the Evaluator Rotation Rule and SAVES FeedbackRequest records for all
     * L04 Department Heads in the given cycle.
     * <p>
     * - currentCycleId  : The new appraisal cycle to generate assignments for.
     * - previousCycleId : The last cycle (used to check who already evaluated whom).
     *                     Pass null / omit if this is the very first cycle.
     *
     * <pre>
     * Example:
     *   POST /api/v1/feedback/rotation/generate?currentCycleId=3&previousCycleId=2
     * </pre>
     */
    @PostMapping("/rotation/generate")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<ApiResponse<?>> generateRotationAssignments(
            @RequestParam Long currentCycleId,
            @RequestParam(required = false) Long previousCycleId) {

        evaluatorRotationService.generateTopManagementAssignments(currentCycleId, previousCycleId);
        return ResponseEntity.ok(ApiResponse.success(
                "Top Management evaluator assignments generated successfully using Rotation Rule."));
    }

    /**
     * [GET] /api/v1/feedback/rotation/preview
     * <p>
     * DRY-RUN — returns the proposed evaluator assignments WITHOUT saving anything.
     * Use this to verify the rotation rule results before committing.
     * <p>
     * Response includes {@code roundRobinFallback = true} for any target where the
     * system ran out of fresh evaluators and had to use the Least Recently Evaluated fallback.
     *
     * <pre>
     * Example:
     *   GET /api/v1/feedback/rotation/preview?currentCycleId=3&previousCycleId=2
     * </pre>
     */
    @GetMapping("/rotation/preview")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<ApiResponse<List<EvaluatorAssignmentDTO>>> previewRotationAssignments(
            @RequestParam Long currentCycleId,
            @RequestParam(required = false) Long previousCycleId) {

        List<EvaluatorAssignmentDTO> assignments =
                evaluatorRotationService.previewTopManagementAssignments(currentCycleId, previousCycleId);
        return ResponseEntity.ok(ApiResponse.success(assignments));
    }

    /**
     * [GET] /api/v1/feedback/rotation/assign
     * <p>
     * Returns the single best evaluator for ONE specific L04 Department Head
     * based on the rotation rule — without persisting.
     * Useful for manual override checks or UI previews per employee.
     *
     * <pre>
     * Example:
     *   GET /api/v1/feedback/rotation/assign?targetEmployeeId=15&currentCycleId=3&previousCycleId=2
     * </pre>
     */
    @GetMapping("/rotation/assign")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<ApiResponse<EvaluatorAssignmentDTO>> getAssignedEvaluatorForTarget(
            @RequestParam Long targetEmployeeId,
            @RequestParam Long currentCycleId,
            @RequestParam(required = false) Long previousCycleId) {

        Employee evaluator = evaluatorRotationService.assignTopManagementEvaluator(
                targetEmployeeId, currentCycleId, previousCycleId);

        EvaluatorAssignmentDTO dto = EvaluatorAssignmentDTO.builder()
                .targetEmployeeId(targetEmployeeId)
                .evaluatorId(evaluator.getId())
                .evaluatorName(evaluator.getStaffName())
                .evaluatorLevelCode(evaluator.getLevel() != null
                        ? evaluator.getLevel().getLevelCode() : "N/A")
                .cycleId(currentCycleId)
                .build();

        return ResponseEntity.ok(ApiResponse.success(dto));
    }
}

