package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.appraisal.AppraisalAssignRequest;
import ace.org.epms_backend.dto.appraisal.AppraisalCreateRequest;
import ace.org.epms_backend.model.appraisal.Appraisal;
import ace.org.epms_backend.service.AppraisalCalculationService;
import ace.org.epms_backend.service.AppraisalService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/appraisal")
@RequiredArgsConstructor
public class AppraisalController {

    private final AppraisalService appraisalService;
    private final AppraisalCalculationService calculationService;

    // ✅ CREATE
    @PostMapping("/create")
    public String create(@RequestBody AppraisalCreateRequest request) {
        appraisalService.createAppraisal(request);
        return "Appraisal created successfully";
    }

    // ✅ ASSIGN
    @PostMapping("/assign")
    public String assign(@RequestBody AppraisalAssignRequest request) {
        appraisalService.assignAppraisal(request);
        return "Appraisal assigned successfully";
    }

    // ✅ GET
    @GetMapping("/{id}")
    public Appraisal get(@PathVariable Long id) {
        return appraisalService.getAppraisal(id);
    }

    // ✅ CALCULATE
    @PostMapping("/{id}/calculate")
    public String calculate(@PathVariable Long id) {
        calculationService.calculateScore(id);
        return "Score calculated successfully";
    }

    // ✅ FINALIZE
    @PostMapping("/{id}/finalize")
    public String finalizeAppraisal(@PathVariable Long id) {
        appraisalService.finalizeAppraisal(id);
        return "Appraisal finalized successfully";
    }
}
