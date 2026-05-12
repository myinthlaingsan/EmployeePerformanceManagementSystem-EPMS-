package ace.org.epms_backend.controller.feedback360;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.feedback360.*;
import ace.org.epms_backend.model.UserPrincipal;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.dto.appraisal.FullFormResponse;
import ace.org.epms_backend.service.feedback360.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/feedback")
@RequiredArgsConstructor
public class Feedback360Controller {

    private final FeedbackRequestService    feedbackRequestService;
    private final FeedbackSubmissionService feedbackSubmissionService;
    private final FeedbackReportService     feedbackReportService;
    private final EvaluatorRotationService  evaluatorRotationService;
    private final FeedbackFormService       feedbackFormService;

    @GetMapping("/form/cycle/{cycleId}")
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<ApiResponse<FullFormResponse>> getFeedbackFormForCycle(@PathVariable Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(feedbackFormService.getFeedbackFormForCycle(cycleId)));
    }

    @PostMapping("/form/cycle/{cycleId}")
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<ApiResponse<Long>> saveFeedbackFormForCycle(
            @PathVariable Long cycleId,
            @RequestBody FeedbackFormCreationRequest request) {
        return ResponseEntity.ok(ApiResponse.success(feedbackFormService.saveFeedbackFormForCycle(cycleId, request)));
    }

    @PostMapping("/generate")
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<ApiResponse<?>> generateRequests(
            @RequestParam Long cycleId,
            @RequestParam(required = false) Long previousCycleId,
            @RequestParam(defaultValue = "7") int globalMaxLimit,
            @RequestParam(defaultValue = "true") boolean excludeLongTermLeave) {
        feedbackRequestService.generate360FeedbackRequests(cycleId, previousCycleId, globalMaxLimit, excludeLongTermLeave);
        return ResponseEntity.ok(ApiResponse.success("Enhanced feedback requests generated successfully and cycle is now LOCKED."));
    }

    @PostMapping("/finalize-evaluators")
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<ApiResponse<?>> finalizeEvaluators(@RequestParam Long cycleId) {
        feedbackRequestService.finalizeEvaluators(cycleId);
        return ResponseEntity.ok(ApiResponse.success("Evaluator list finalized. You can now generate requests."));
    }

    @PostMapping("/reset-status")
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<ApiResponse<?>> resetCycleStatus(@RequestParam Long cycleId) {
        feedbackRequestService.resetCycleStatus(cycleId);
        return ResponseEntity.ok(ApiResponse.success("Cycle status reset to PLANNING and pending requests deleted."));
    }

    @PostMapping("/regenerate-all")
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<ApiResponse<?>> regenerateAll(
            @RequestParam Long cycleId,
            @RequestParam(required = false) Long previousCycleId,
            @RequestParam(defaultValue = "7") int globalMaxLimit,
            @RequestParam(defaultValue = "true") boolean excludeLongTermLeave) {
        feedbackRequestService.regenerateAll(cycleId, previousCycleId, globalMaxLimit, excludeLongTermLeave);
        return ResponseEntity.ok(ApiResponse.success("Force regeneration completed. Old pending requests have been replaced."));
    }

    @GetMapping("/validate-generation/{cycleId}")
    public ResponseEntity<GenerationValidationResponse> validateGeneration(
            @PathVariable Long cycleId,
            @RequestParam(defaultValue = "true") boolean excludeLongTermLeave) {
        return ResponseEntity.ok(feedbackRequestService.validate360Generation(cycleId, excludeLongTermLeave));
    }

    @GetMapping("/preview")
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<ApiResponse<List<FeedbackRequestResponse>>> preview360Requests(
            @RequestParam Long cycleId,
            @RequestParam(required = false) Long previousCycleId,
            @RequestParam(defaultValue = "7") int globalMaxLimit,
            @RequestParam(defaultValue = "true") boolean excludeLongTermLeave) {
        List<FeedbackRequestResponse> preview = feedbackRequestService.preview360FeedbackRequests(cycleId, previousCycleId, globalMaxLimit, excludeLongTermLeave);
        return ResponseEntity.ok(ApiResponse.success(preview));
    }

    @PostMapping("/regenerate-user")
    @PreAuthorize("hasRole('ROLE_HR')")
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

    @GetMapping("/request/{requestId}/questions")
    public ResponseEntity<ApiResponse<FullFormResponse>> getQuestionsForRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(ApiResponse.success(feedbackFormService.getQuestionsForRequest(requestId)));
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

    @PostMapping("/rotation/generate")
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<ApiResponse<?>> generateRotationAssignments(
            @RequestParam Long currentCycleId,
            @RequestParam(required = false) Long previousCycleId) {
        evaluatorRotationService.generateTopManagementAssignments(currentCycleId, previousCycleId);
        return ResponseEntity.ok(ApiResponse.success("Top Management assignments generated."));
    }

    @GetMapping("/rotation/preview")
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<ApiResponse<List<EvaluatorAssignmentDTO>>> previewRotationAssignments(
            @RequestParam Long currentCycleId,
            @RequestParam(required = false) Long previousCycleId) {
        return ResponseEntity.ok(ApiResponse.success(evaluatorRotationService.previewTopManagementAssignments(currentCycleId, previousCycleId)));
    }

    @GetMapping("/rotation/assign")
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<ApiResponse<EvaluatorAssignmentDTO>> getAssignedEvaluatorForTarget(
            @RequestParam Long targetEmployeeId,
            @RequestParam Long currentCycleId,
            @RequestParam(required = false) Long previousCycleId) {
        Employee evaluator = evaluatorRotationService.assignTopManagementEvaluator(targetEmployeeId, currentCycleId, previousCycleId);
        EvaluatorAssignmentDTO dto = EvaluatorAssignmentDTO.builder()
                .targetEmployeeId(targetEmployeeId)
                .evaluatorId(evaluator.getId())
                .evaluatorName(evaluator.getStaffName())
                .evaluatorLevelCode(evaluator.getLevel() != null ? evaluator.getLevel().getLevelCode() : "N/A")
                .cycleId(currentCycleId)
                .build();
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/my-submissions")
    public ResponseEntity<ApiResponse<List<FeedbackDetailsResponse>>> getMySubmissions(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(feedbackSubmissionService.getMySubmittedFeedbacks(principal.getEmployee().getId())));
    }

    @GetMapping("/submission/{requestId}")
    public ResponseEntity<ApiResponse<FeedbackDetailsResponse>> getSubmissionByRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(ApiResponse.success(feedbackSubmissionService.getFeedbackByRequest(requestId)));
    }

    @GetMapping("/cycle/{cycleId}/requests")
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<ApiResponse<List<FeedbackRequestResponse>>> getRequestsByCycle(@PathVariable Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(feedbackRequestService.getRequestsByCycle(cycleId)));
    }

    @GetMapping("/cycle/{cycleId}/progress")
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getCycleProgress(@PathVariable Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(feedbackRequestService.getRequestStatusCountByCycle(cycleId)));
    }

    @GetMapping("/employee/{employeeId}/requests")
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<ApiResponse<List<FeedbackRequestResponse>>> getRequestsByEmployee(
            @PathVariable Long employeeId, @RequestParam Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(feedbackRequestService.getRequestsByEmployee(employeeId, cycleId)));
    }
}
