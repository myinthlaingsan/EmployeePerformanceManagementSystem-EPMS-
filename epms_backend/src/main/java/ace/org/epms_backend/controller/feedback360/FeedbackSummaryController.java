package ace.org.epms_backend.controller.feedback360;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.feedback360.FeedbackSummaryResponse;
import ace.org.epms_backend.model.UserPrincipal;
import ace.org.epms_backend.service.feedback360.FeedbackSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/360-feedback/summary")
@RequiredArgsConstructor
public class FeedbackSummaryController {

    private final FeedbackSummaryService summaryService;

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<Void>> generateSummary(@RequestParam Long employeeId, @RequestParam Long cycleId) {
        summaryService.generateSummary(employeeId, cycleId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/generate-all")
    public ResponseEntity<ApiResponse<Void>> generateAllSummaries(@RequestParam Long cycleId) {
        summaryService.generateAllSummaries(cycleId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/employee/{employeeId}/cycle/{cycleId}")
    public ResponseEntity<ApiResponse<FeedbackSummaryResponse>> getSummary(@PathVariable Long employeeId, @PathVariable Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(summaryService.getSummary(employeeId, cycleId)));
    }

    @GetMapping("/cycle/{cycleId}")
    public ResponseEntity<ApiResponse<List<FeedbackSummaryResponse>>> getSummariesByCycle(@PathVariable Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(summaryService.getSummariesByCycle(cycleId)));
    }

    @PutMapping("/{summaryId}/finalize")
    public ResponseEntity<ApiResponse<Void>> finalizeSummary(@PathVariable Long summaryId) {
        summaryService.finalizeSummary(summaryId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/my-summaries")
    public ResponseEntity<ApiResponse<List<FeedbackSummaryResponse>>> getMySummaries(
            @AuthenticationPrincipal UserPrincipal principal) {
        // We reuse getSummariesByCycle logic but filtered for user and finalized=true
        // Actually, let's add a proper service method for this
        return ResponseEntity.ok(ApiResponse.success(summaryService.getFinalizedSummariesForEmployee(principal.getEmployee().getId())));
    }
}
