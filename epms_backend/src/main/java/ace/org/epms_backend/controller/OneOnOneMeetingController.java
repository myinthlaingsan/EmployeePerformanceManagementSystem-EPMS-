package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.PagedResponse;
import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.continuous.MeetingCommentRequest;
import ace.org.epms_backend.dto.continuous.MeetingCommentResponse;
import ace.org.epms_backend.dto.continuous.OneOnOneMeetingRequest;
import ace.org.epms_backend.dto.continuous.OneOnOneMeetingResponse;
import ace.org.epms_backend.service.OneOnOneMeetingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class OneOnOneMeetingController {

    private final OneOnOneMeetingService meetingService;

    // --- MEETING APIs ---

    @GetMapping("/meetings")
    public ResponseEntity<ApiResponse<PagedResponse<OneOnOneMeetingResponse>>> getAllMeetings(
            @RequestParam(required = false) ace.org.epms_backend.enums.ContinuousStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<OneOnOneMeetingResponse> responses = meetingService.getAllMeetings(status, page, size);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PostMapping("/meetings")
    public ResponseEntity<ApiResponse<OneOnOneMeetingResponse>> scheduleMeeting(
            @Valid @RequestBody OneOnOneMeetingRequest request) {
        OneOnOneMeetingResponse response = meetingService.scheduleMeeting(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @GetMapping("/meetings/{meetingId}")
    public ResponseEntity<ApiResponse<OneOnOneMeetingResponse>> getMeetingById(
            @PathVariable Long meetingId) {
        OneOnOneMeetingResponse response = meetingService.getMeetingById(meetingId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/meetings/employee/{employeeId}")
    public ResponseEntity<ApiResponse<PagedResponse<OneOnOneMeetingResponse>>> getMeetingsByEmployee(
            @PathVariable Long employeeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<OneOnOneMeetingResponse> responses = meetingService.getMeetingsByEmployee(employeeId, page, size);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/meetings/manager/{managerId}")
    public ResponseEntity<ApiResponse<PagedResponse<OneOnOneMeetingResponse>>> getMeetingsByManager(
            @PathVariable Long managerId,
            @RequestParam(required = false) ace.org.epms_backend.enums.ContinuousStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<OneOnOneMeetingResponse> responses = meetingService.getMeetingsByManager(managerId, status, page, size);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PutMapping("/meetings/{meetingId}")
    public ResponseEntity<ApiResponse<OneOnOneMeetingResponse>> updateMeeting(
            @PathVariable Long meetingId,
            @Valid @RequestBody OneOnOneMeetingRequest request) {
        OneOnOneMeetingResponse response = meetingService.updateMeeting(meetingId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/meetings/{meetingId}")
    public ResponseEntity<ApiResponse<Void>> deleteMeeting(@PathVariable Long meetingId) {
        meetingService.deleteMeeting(meetingId);
        return ResponseEntity.ok(ApiResponse.success());
    }

    @PatchMapping("/meetings/{meetingId}/publish")
    public ResponseEntity<ApiResponse<OneOnOneMeetingResponse>> publishMeeting(@PathVariable Long meetingId) {
        OneOnOneMeetingResponse response = meetingService.publishMeeting(meetingId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/meetings/employee/{employeeId}/stats")
    public ResponseEntity<ApiResponse<ace.org.epms_backend.dto.continuous.ContinuousStatsResponse>> getMeetingStats(
            @PathVariable Long employeeId) {
        ace.org.epms_backend.dto.continuous.ContinuousStatsResponse response = meetingService.getMeetingStats(employeeId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/meetings/manager/{managerId}/stats")
    public ResponseEntity<ApiResponse<ace.org.epms_backend.dto.continuous.ContinuousStatsResponse>> getMeetingStatsForManager(
            @PathVariable Long managerId) {
        ace.org.epms_backend.dto.continuous.ContinuousStatsResponse response = meetingService.getMeetingStatsForManager(managerId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // --- COMMENT APIs ---

    @PostMapping("/meetings/{meetingId}/comments")
    public ResponseEntity<ApiResponse<MeetingCommentResponse>> addComment(
            @PathVariable Long meetingId,
            @Valid @RequestBody MeetingCommentRequest request) {
        MeetingCommentResponse response = meetingService.addComment(meetingId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @GetMapping("/meetings/{meetingId}/comments")
    public ResponseEntity<ApiResponse<List<MeetingCommentResponse>>> getCommentsByMeetingId(
            @PathVariable Long meetingId) {
        List<MeetingCommentResponse> responses = meetingService.getCommentsByMeetingId(meetingId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PutMapping("/meetings/comments/{commentId}")
    public ResponseEntity<ApiResponse<MeetingCommentResponse>> updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody MeetingCommentRequest request) {
        MeetingCommentResponse response = meetingService.updateComment(commentId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/meetings/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable Long commentId) {
        meetingService.deleteComment(commentId);
        return ResponseEntity.ok(ApiResponse.success());
    }

    // --- ACTION ITEM APIs ---

    @PutMapping("/meetings/{meetingId}/items/{itemId}/status")
    public ResponseEntity<ApiResponse<Void>> updateActionItemStatus(
            @PathVariable Long meetingId,
            @PathVariable Long itemId,
            @RequestParam ace.org.epms_backend.enums.ActionItemStatus status) {
        meetingService.updateActionItemStatus(meetingId, itemId, status);
        return ResponseEntity.ok(ApiResponse.success("Action item status updated successfully", null));
    }

    @PutMapping("/meetings/{meetingId}/items/{itemId}/reopen")
    public ResponseEntity<ApiResponse<Void>> reopenActionItem(
            @PathVariable Long meetingId,
            @PathVariable Long itemId,
            @RequestParam String reason) {
        meetingService.reopenActionItem(meetingId, itemId, reason);
        return ResponseEntity.ok(ApiResponse.success("Action item re-opened successfully", null));
    }
}
