package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.appraisal.AppraisalSummaryResponse;
import ace.org.epms_backend.service.appraisal.FinalAppraisalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/appraisal-summary")
@RequiredArgsConstructor
public class FinalAppraisalController {

    private final FinalAppraisalService finalAppraisalService;

    @PostMapping("/generate")
    public ResponseEntity<Void> generateFinal(@RequestParam Long employeeId, @RequestParam Long cycleId) {
        finalAppraisalService.generateFinalScore(employeeId, cycleId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/employee/{employeeId}/cycle/{cycleId}")
    public ResponseEntity<AppraisalSummaryResponse> getFinalResult(@PathVariable Long employeeId, @PathVariable Long cycleId) {
        return ResponseEntity.ok(finalAppraisalService.getFinalResult(employeeId, cycleId));
    }

}
