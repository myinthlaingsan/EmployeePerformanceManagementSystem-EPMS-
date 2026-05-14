package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.service.PerformanceScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/scores")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN', 'HR')")
public class PerformanceScoreController {

    private final PerformanceScoreService performanceScoreService;

    @GetMapping("/kpi")
    public ResponseEntity<ApiResponse<BigDecimal>> getKpiTotalScore(
            @RequestParam Long employeeId,
            @RequestParam Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(performanceScoreService.getKpiTotalScore(employeeId, cycleId, null)));
    }

    @GetMapping("/self-assessment/{appraisalId}")
    public ResponseEntity<ApiResponse<BigDecimal>> getSelfAssessmentTotalScore(@PathVariable Long appraisalId) {
        return ResponseEntity.ok(ApiResponse.success(performanceScoreService.getSelfAssessmentTotalScore(appraisalId)));
    }

    @GetMapping("/manager-evaluation/{appraisalId}")
    public ResponseEntity<ApiResponse<BigDecimal>> getManagerEvaluationTotalScore(@PathVariable Long appraisalId) {
        return ResponseEntity.ok(ApiResponse.success(performanceScoreService.getManagerEvaluationTotalScore(appraisalId)));
    }
}
