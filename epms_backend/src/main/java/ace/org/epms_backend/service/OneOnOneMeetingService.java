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
    PagedResponse<OneOnOneMeetingResponse> getMeetingsByManager(Long managerId, int page, int size);
    PagedResponse<OneOnOneMeetingResponse> getAllMeetings(int page, int size);
    OneOnOneMeetingResponse updateMeeting(Long meetingId, OneOnOneMeetingRequest request);
    void deleteMeeting(Long meetingId);

    MeetingCommentResponse addComment(Long meetingId, MeetingCommentRequest request);
    List<MeetingCommentResponse> getCommentsByMeetingId(Long meetingId);
    MeetingCommentResponse updateComment(Long commentId, MeetingCommentRequest request);
    void deleteComment(Long commentId);
}
