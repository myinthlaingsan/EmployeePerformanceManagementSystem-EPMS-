package ace.org.epms_backend.controller.calibration;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.calibration.*;
import ace.org.epms_backend.model.UserPrincipal;
import ace.org.epms_backend.service.calibration.CalibrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/calibration")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','HR')")
public class CalibrationController {

    private final CalibrationService calibrationService;

    // ── Per-summary actions ──────────────────────────────────────────────────

    @PostMapping("/summaries/{summaryId}/flag")
    public ResponseEntity<ApiResponse<?>> flag(
            @PathVariable Long summaryId,
            @AuthenticationPrincipal UserPrincipal principal) {
        calibrationService.flagForReview(summaryId, principal.getEmployee().getId());
        return ResponseEntity.ok(ApiResponse.success("Summary flagged for review"));
    }

    @PutMapping("/summaries/{summaryId}/adjust")
    public ResponseEntity<ApiResponse<?>> adjust(
            @PathVariable Long summaryId,
            @Valid @RequestBody AdjustScoreRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        calibrationService.adjustScore(summaryId, req, principal.getEmployee().getId());
        return ResponseEntity.ok(ApiResponse.success("Score adjusted"));
    }

    @PostMapping("/summaries/{summaryId}/approve")
    public ResponseEntity<ApiResponse<?>> approve(
            @PathVariable Long summaryId,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        String comment = body != null ? body.get("approverComment") : null;
        calibrationService.approve(summaryId, comment, principal.getEmployee().getId());
        return ResponseEntity.ok(ApiResponse.success("Summary approved"));
    }

    @PostMapping("/summaries/{summaryId}/revert")
    public ResponseEntity<ApiResponse<?>> revert(
            @PathVariable Long summaryId,
            @AuthenticationPrincipal UserPrincipal principal) {
        calibrationService.revert(summaryId, principal.getEmployee().getId());
        return ResponseEntity.ok(ApiResponse.success("Summary reverted to UNDER_REVIEW"));
    }

    // ── Session lifecycle ────────────────────────────────────────────────────

    @PostMapping("/sessions")
    public ResponseEntity<ApiResponse<CalibrationSessionResponse>> createSession(
            @Valid @RequestBody CreateSessionRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        CalibrationSessionResponse session =
                calibrationService.createSession(req, principal.getEmployee().getId());
        return ResponseEntity.ok(ApiResponse.success(session));
    }

    @PostMapping("/sessions/{sessionId}/summaries")
    public ResponseEntity<ApiResponse<?>> addSummaries(
            @PathVariable Long sessionId,
            @RequestBody Map<String, List<Long>> body) {
        calibrationService.addSummariesToSession(sessionId, body.get("summaryIds"));
        return ResponseEntity.ok(ApiResponse.success("Summaries added to session"));
    }

    @PostMapping("/sessions/{sessionId}/start")
    public ResponseEntity<ApiResponse<?>> startSession(@PathVariable Long sessionId) {
        calibrationService.startSession(sessionId);
        return ResponseEntity.ok(ApiResponse.success("Session started"));
    }

    @PostMapping("/sessions/{sessionId}/complete")
    public ResponseEntity<ApiResponse<?>> completeSession(@PathVariable Long sessionId) {
        calibrationService.completeSession(sessionId);
        return ResponseEntity.ok(ApiResponse.success("Session completed"));
    }

    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<CalibrationSessionResponse>>> listSessions(
            @RequestParam Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(calibrationService.listSessionsByCycle(cycleId)));
    }

    // ── Reports ──────────────────────────────────────────────────────────────

    @GetMapping("/cycle/{cycleId}/deltas")
    public ResponseEntity<ApiResponse<List<CalibrationDeltaRow>>> getDeltas(
            @PathVariable Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(calibrationService.getCalibrationDeltas(cycleId)));
    }

    @GetMapping("/cycle/{cycleId}/distribution")
    public ResponseEntity<ApiResponse<DistributionStats>> getDistribution(
            @PathVariable Long cycleId,
            @RequestParam(defaultValue = "false") boolean calibrated) {
        return ResponseEntity.ok(ApiResponse.success(
                calibrationService.getScoreDistribution(cycleId, calibrated)));
    }

    // ── Cycle freeze ─────────────────────────────────────────────────────────

    @PostMapping("/cycle/{cycleId}/lock")
    public ResponseEntity<ApiResponse<?>> lockCycle(
            @PathVariable Long cycleId,
            @AuthenticationPrincipal UserPrincipal principal) {
        calibrationService.lockCycle(cycleId, principal.getEmployee().getId());
        return ResponseEntity.ok(ApiResponse.success("Cycle locked — all summaries finalized"));
    }
}
