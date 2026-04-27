package ace.org.epms_backend.controller;

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
    public ResponseEntity<ApiResponse<List<OneOnOneMeetingResponse>>> getMeetingsByEmployee(
            @PathVariable Long employeeId) {
        List<OneOnOneMeetingResponse> responses = meetingService.getMeetingsByEmployee(employeeId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/meetings/manager/{managerId}")
    public ResponseEntity<ApiResponse<List<OneOnOneMeetingResponse>>> getMeetingsByManager(
            @PathVariable Long managerId) {
        List<OneOnOneMeetingResponse> responses = meetingService.getMeetingsByManager(managerId);
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

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable Long commentId) {
        meetingService.deleteComment(commentId);
        return ResponseEntity.ok(ApiResponse.success());
    }
}
