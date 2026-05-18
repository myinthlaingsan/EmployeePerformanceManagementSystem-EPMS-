package ace.org.epms_backend.controller.feedback360;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.feedback360.NominationProposalRequest;
import ace.org.epms_backend.dto.feedback360.NominationResponse;
import ace.org.epms_backend.model.UserPrincipal;
import ace.org.epms_backend.service.feedback360.FeedbackNominationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/feedback/nomination")
@RequiredArgsConstructor
public class FeedbackNominationController {

    private final FeedbackNominationService nominationService;

    @PostMapping
    public ResponseEntity<ApiResponse<NominationResponse>> propose(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody NominationProposalRequest request) {
        NominationResponse created = nominationService.propose(principal.getEmployee().getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Nomination proposed", created));
    }

    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<List<NominationResponse>>> getMyNominations(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                nominationService.getMyNominations(principal.getEmployee().getId())));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','HR','MANAGER')")
    public ResponseEntity<ApiResponse<NominationResponse>> approve(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Nomination approved",
                nominationService.approve(id, principal.getEmployee().getId())));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','HR','MANAGER')")
    public ResponseEntity<ApiResponse<NominationResponse>> reject(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Nomination rejected",
                nominationService.reject(id, principal.getEmployee().getId())));
    }
}
