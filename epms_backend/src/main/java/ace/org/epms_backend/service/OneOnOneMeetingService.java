package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.PagedResponse;
import ace.org.epms_backend.dto.continuous.MeetingCommentRequest;
import ace.org.epms_backend.dto.continuous.MeetingCommentResponse;
import ace.org.epms_backend.dto.continuous.OneOnOneMeetingRequest;
import ace.org.epms_backend.dto.continuous.OneOnOneMeetingResponse;

import java.util.List;

public interface OneOnOneMeetingService {
    OneOnOneMeetingResponse scheduleMeeting(OneOnOneMeetingRequest request);
    OneOnOneMeetingResponse getMeetingById(Long meetingId);
    PagedResponse<OneOnOneMeetingResponse> getMeetingsByEmployee(Long employeeId, int page, int size);
    PagedResponse<OneOnOneMeetingResponse> getMeetingsByManager(Long managerId, ace.org.epms_backend.enums.ContinuousStatus status, int page, int size);
    ace.org.epms_backend.dto.continuous.ContinuousStatsResponse getMeetingStatsForManager(Long managerId);
    PagedResponse<OneOnOneMeetingResponse> getAllMeetings(ace.org.epms_backend.enums.ContinuousStatus status, int page, int size);
    OneOnOneMeetingResponse updateMeeting(Long meetingId, OneOnOneMeetingRequest request);
    void deleteMeeting(Long meetingId);
    OneOnOneMeetingResponse publishMeeting(Long meetingId);
    ace.org.epms_backend.dto.continuous.ContinuousStatsResponse getMeetingStats(Long employeeId);

    MeetingCommentResponse addComment(Long meetingId, MeetingCommentRequest request);
    List<MeetingCommentResponse> getCommentsByMeetingId(Long meetingId);
    MeetingCommentResponse updateComment(Long commentId, MeetingCommentRequest request);
    void deleteComment(Long commentId);
    void updateActionItemStatus(Long meetingId, Long itemId, ace.org.epms_backend.enums.ActionItemStatus status);
    void reopenActionItem(Long meetingId, Long itemId, String reason);
}
