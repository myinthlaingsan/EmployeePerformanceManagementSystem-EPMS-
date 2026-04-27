package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.pip.PipReviewRequest;
import ace.org.epms_backend.dto.pip.PipReviewResponse;
import ace.org.epms_backend.enums.PipOutcome;
import ace.org.epms_backend.service.PipReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pip/reviews")
@RequiredArgsConstructor
public class PipReviewController {

    private final PipReviewService service;

    // HR or Manager creates review
    @PreAuthorize("hasAnyRole('HR','MANAGER')")
    @PostMapping
    public ResponseEntity<ApiResponse<PipReviewResponse>> create(
            @Valid @RequestBody PipReviewRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(service.createReview(request))
        );
    }

    // Everyone involved can view
    @PreAuthorize("hasAnyRole('HR','MANAGER','EMPLOYEE')")
    @GetMapping("/{pipId}")
    public ResponseEntity<ApiResponse<List<PipReviewResponse>>> getByPip(
            @PathVariable Long pipId
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(service.getReviewsByPip(pipId))
        );
    }

    // HR or Manager final decision
    @PreAuthorize("hasAnyRole('HR','MANAGER')")
    @PutMapping("/{pipId}/finalize")
    public ResponseEntity<ApiResponse<Void>> finalizePip(
            @PathVariable Long pipId,
            @RequestParam PipOutcome outcome,
            @RequestParam String comment
    ) {
        service.finalizePip(pipId, outcome, comment);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
