package ace.org.epms_backend.controller.feedback360;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.feedback360.EmployeeEvaluationDTO;
import ace.org.epms_backend.service.feedback360.FeedbackSelectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/feedback-selection")
@RequiredArgsConstructor
public class FeedbackSelectionController {

    private final FeedbackSelectionService feedbackSelectionService;

    @GetMapping("/suggest/{employeeId}")
    public ResponseEntity<ApiResponse<List<EmployeeEvaluationDTO>>> getSuggestions(@PathVariable Long employeeId) {
        List<EmployeeEvaluationDTO> suggestions = feedbackSelectionService.suggestEvaluators(employeeId);
        return ResponseEntity.ok(ApiResponse.success(suggestions));
    }

    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse<String>> confirmEvaluators(
            @RequestParam Long targetId,
            @RequestParam Long cycleId,
            @RequestBody List<EmployeeEvaluationDTO> selectedEvaluators) {

        feedbackSelectionService.confirmEvaluators(targetId, cycleId, selectedEvaluators);
        return ResponseEntity.ok(ApiResponse.success("Feedback requests created successfully!"));
    }
}