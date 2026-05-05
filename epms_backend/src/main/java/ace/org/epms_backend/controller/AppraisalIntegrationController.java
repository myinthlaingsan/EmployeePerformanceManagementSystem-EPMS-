package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.appraisal.AppraisalSyncRequest;
import ace.org.epms_backend.model.appraisal.Appraisal;
import ace.org.epms_backend.service.appraisal.AppraisalIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/appraisals")
@RequiredArgsConstructor
public class AppraisalIntegrationController {

    private final AppraisalIntegrationService appraisalService;

    @PostMapping("/sync-feedback")
    public ResponseEntity<Void> syncFeedback(@RequestBody AppraisalSyncRequest request) {
        appraisalService.syncFeedbackToAppraisal(request.getCycleId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/employee/{employeeId}/cycle/{cycleId}")
    public ResponseEntity<Appraisal> getAppraisal(@PathVariable Long employeeId, @PathVariable Long cycleId) {
        return ResponseEntity.ok(appraisalService.getAppraisal(employeeId, cycleId));
    }

    @PutMapping("/{appraisalId}/score")
    public ResponseEntity<Void> updateScore(@PathVariable Long appraisalId, @RequestParam BigDecimal score) {
        appraisalService.updateFormScore(appraisalId, score);
        return ResponseEntity.ok().build();
    }
}
