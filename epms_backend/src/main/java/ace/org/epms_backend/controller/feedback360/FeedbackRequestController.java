package ace.org.epms_backend.controller.feedback360;

import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.feedback360.PendingFeedbackDTO;
import ace.org.epms_backend.service.feedback360.FeedbackRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/360-feedback/requests")
@RequiredArgsConstructor
public class FeedbackRequestController {

    private final FeedbackRequestService requestService;

    /**
     * HR Dashboard: Returns ALL pending feedback requests across every cycle.
     */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<ApiResponse<List<PendingFeedbackDTO>>> getAllPendingFeedbacks() {
        return ResponseEntity.ok(ApiResponse.success(requestService.getAllPendingFeedbacks()));
    }

    @PostMapping("/remind/{requestId}")
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<ApiResponse<Void>> sendReminder(@PathVariable Long requestId) {
        requestService.sendReminder(requestId);
        return ResponseEntity.ok(ApiResponse.success(null, "Reminder sent successfully"));
    }

    @PostMapping("/remind-all")
    @PreAuthorize("hasRole('ROLE_HR')")
    public ResponseEntity<ApiResponse<Void>> sendRemindersToAll(@RequestParam(required = false) Long cycleId) {
        requestService.sendRemindersToAll(cycleId);
        return ResponseEntity.ok(ApiResponse.success(null, "Reminders sent to all pending evaluators"));
    }
}
