package ace.org.epms_backend.controller.feedback360;

import ace.org.epms_backend.dto.feedback360.FeedbackRequestResponse;
import ace.org.epms_backend.dto.feedback360.GenerateRequestTrigger;
import ace.org.epms_backend.enums.FeedbackStatus;
import ace.org.epms_backend.service.feedback360.FeedbackRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/360-feedback/requests")
@RequiredArgsConstructor
public class FeedbackRequestController {

    private final FeedbackRequestService requestService;

    @PostMapping("/generate")
    public ResponseEntity<Void> generateRequests(@RequestBody GenerateRequestTrigger trigger) {
        requestService.generate360FeedbackRequests(trigger.getCycleId(), 1, 3, 1, 3);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/my")
    public ResponseEntity<List<FeedbackRequestResponse>> getMyRequests(@RequestParam Long evaluatorId) {
        return ResponseEntity.ok(requestService.getMyPendingRequests(evaluatorId));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<FeedbackRequestResponse>> getByEmployee(@PathVariable Long employeeId, @RequestParam Long cycleId) {
        return ResponseEntity.ok(requestService.getRequestsByEmployee(employeeId, cycleId));
    }

    @GetMapping("/cycle/{cycleId}")
    public ResponseEntity<List<FeedbackRequestResponse>> getByCycle(@PathVariable Long cycleId) {
        return ResponseEntity.ok(requestService.getRequestsByCycle(cycleId));
    }

    @GetMapping("/{requestId}")
    public ResponseEntity<FeedbackRequestResponse> getRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(requestService.getRequest(requestId));
    }

    @PutMapping("/{requestId}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable Long requestId, @RequestParam FeedbackStatus status) {
        requestService.updateRequestStatus(requestId, status);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{requestId}")
    public ResponseEntity<Void> deleteRequest(@PathVariable Long requestId) {
        requestService.deleteRequest(requestId);
        return ResponseEntity.ok().build();
    }
}
