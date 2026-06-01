package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.kpi.MidcycleChangeRequest;
import ace.org.epms_backend.dto.kpi.MidcycleSummaryResponse;
import ace.org.epms_backend.service.kpi.KpiMidcycleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/kpi/midcycle")
@RequiredArgsConstructor
public class KpiMidcycleController {

    private final KpiMidcycleService midcycleService;

    @PostMapping("/change")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> triggerMidcycleChange(
            @Valid @RequestBody MidcycleChangeRequest request) {
        midcycleService.triggerMidcycleChange(request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{employeeId}/{cycleId}/finalize")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> finalizeCompositeScore(
            @PathVariable Long employeeId,
            @PathVariable Long cycleId) {
        midcycleService.finalizeCompositeScore(employeeId, cycleId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{employeeId}/{cycleId}/calculate")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> calculateCompositeScore(
            @PathVariable Long employeeId,
            @PathVariable Long cycleId) {
        midcycleService.calculateCompositeFinalScore(employeeId, cycleId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/{employeeId}/{cycleId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ApiResponse<MidcycleSummaryResponse>> getMidcycleSummary(
            @PathVariable Long employeeId,
            @PathVariable Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(midcycleService.getMidcycleSummary(employeeId, cycleId)));
    }
}
