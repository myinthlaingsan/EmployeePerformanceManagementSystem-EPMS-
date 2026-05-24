package ace.org.epms_backend.controller.feedback360;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.feedback360.ScoringPolicyRequest;
import ace.org.epms_backend.dto.feedback360.ScoringPolicyResponse;
import ace.org.epms_backend.service.feedback360.ScoringPolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/scoring-policy")
@RequiredArgsConstructor
public class ScoringPolicyController {

    private final ScoringPolicyService scoringPolicyService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<List<ScoringPolicyResponse>>> getPolicies(
            @RequestParam Long cycleId) {
        return ResponseEntity.ok(ApiResponse.success(scoringPolicyService.getPoliciesByCycle(cycleId)));
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<ScoringPolicyResponse>> upsert(
            @RequestBody ScoringPolicyRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Scoring policy saved", scoringPolicyService.upsert(request)));
    }
}
