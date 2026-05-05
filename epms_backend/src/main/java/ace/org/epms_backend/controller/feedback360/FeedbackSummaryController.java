package ace.org.epms_backend.controller.feedback360;

import ace.org.epms_backend.dto.feedback360.FeedbackSummaryResponse;
import ace.org.epms_backend.service.feedback360.FeedbackSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/360-feedback/summary")
@RequiredArgsConstructor
public class FeedbackSummaryController {

    private final FeedbackSummaryService summaryService;

    @PostMapping("/generate")
    public ResponseEntity<Void> generateSummary(@RequestParam Long employeeId, @RequestParam Long cycleId) {
        summaryService.generateSummary(employeeId, cycleId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/generate-all")
    public ResponseEntity<Void> generateAllSummaries(@RequestParam Long cycleId) {
        summaryService.generateAllSummaries(cycleId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/employee/{employeeId}/cycle/{cycleId}")
    public ResponseEntity<FeedbackSummaryResponse> getSummary(@PathVariable Long employeeId, @PathVariable Long cycleId) {
        return ResponseEntity.ok(summaryService.getSummary(employeeId, cycleId));
    }

    @GetMapping("/cycle/{cycleId}")
    public ResponseEntity<List<FeedbackSummaryResponse>> getSummariesByCycle(@PathVariable Long cycleId) {
        return ResponseEntity.ok(summaryService.getSummariesByCycle(cycleId));
    }

    @PutMapping("/{summaryId}/finalize")
    public ResponseEntity<Void> finalizeSummary(@PathVariable Long summaryId) {
        summaryService.finalizeSummary(summaryId);
        return ResponseEntity.ok().build();
    }
}
