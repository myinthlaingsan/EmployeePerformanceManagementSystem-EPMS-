package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.appraisal.ManagerEvaluationRequest;
import ace.org.epms_backend.service.ManagerEvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/manager-evaluation")
@RequiredArgsConstructor
public class ManagerEvaluationController {

    private final ManagerEvaluationService service;

    @PostMapping("/submit")
    public String submit(@RequestBody ManagerEvaluationRequest request) {
        service.submitEvaluation(request);
        return "Manager evaluation submitted successfully";
    }
}
