package ace.org.epms_backend.controller;

import ace.org.epms_backend.service.AppraisalCalculationService;
import ace.org.epms_backend.service.AppraisalService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/appraisal")
@RequiredArgsConstructor
public class AppraisalController {

    private final AppraisalCalculationService calculationService;
    private final AppraisalService appraisalService;

    // Step 6
    @PostMapping("/{id}/calculate")
    public String calculate(@PathVariable Long id) {
        calculationService.calculateScore(id);
        return "Score calculated successfully";
    }

    // Step 7
    @PostMapping("/{id}/finalize")
    public String finalizeAppraisal(@PathVariable Long id) {
        appraisalService.finalizeAppraisal(id);
        return "Appraisal finalized successfully";
    }
}
