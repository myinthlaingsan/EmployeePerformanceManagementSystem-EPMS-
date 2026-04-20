package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.appraisal.SelfAssessmentSubmitRequest;
import ace.org.epms_backend.service.SelfAssessmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/self-assessment")
@RequiredArgsConstructor
public class SelfAssessmentController {

    private final SelfAssessmentService service;

    @PostMapping("/submit")
    public String submit(@RequestBody SelfAssessmentSubmitRequest request) {
        service.submitSelfAssessment(request);
        return "Self assessment submitted successfully";
    }
}
