package ace.org.epms_backend.controller.feedback360;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.feedback360.FeedbackSummaryResponse;
import ace.org.epms_backend.dto.feedback360.ManagerReviewRequest;
import ace.org.epms_backend.model.UserPrincipal;
import ace.org.epms_backend.service.feedback360.FeedbackSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/360-feedback/summary")
@RequiredArgsConstructor
public class FeedbackSummaryController {

    private final FeedbackSummaryService summaryService;

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<?>> generateSummary(@RequestParam Long employeeId, @RequestParam Long cycleId) {
        summaryService.generateSummary(employeeId, cycleId);
        return ResponseEntity.ok(ApiResponse.success("Summary generated"));
    }

    @PostMapping("/generate-all")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<?>> generateAllSummaries(@RequestParam Long cycleId) {
        summaryService.generateAllSummaries(cycleId);
        return ResponseEntity.ok(ApiResponse.success("All summaries generated"));
    }

    @GetMapping("/employee/{employeeId}/cycle/{cycleId}")
    public ResponseEntity<ApiResponse<FeedbackSummaryResponse>> getSummary(
            @PathVariable Long employeeId, @PathVariable Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(summaryService.getSummary(employeeId, cycleId)));
    }

    @GetMapping("/cycle/{cycleId}")
    public ResponseEntity<ApiResponse<List<FeedbackSummaryResponse>>> getSummariesByCycle(@PathVariable Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(summaryService.getSummariesByCycle(cycleId)));
    }

    @PutMapping("/{summaryId}/finalize")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<?>> finalizeSummary(@PathVariable Long summaryId) {
        summaryService.finalizeSummary(summaryId);
        return ResponseEntity.ok(ApiResponse.success("Summary finalized"));
    }

    @PutMapping("/{summaryId}/manager-review")
    @PreAuthorize("hasAnyRole('ADMIN','HR','MANAGER')")
    public ResponseEntity<ApiResponse<?>> addManagerReview(
            @PathVariable Long summaryId,
            @RequestBody ManagerReviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        summaryService.addManagerReview(summaryId, request, principal.getEmployee().getId());
        return ResponseEntity.ok(ApiResponse.success("Manager review saved"));
    }
}
