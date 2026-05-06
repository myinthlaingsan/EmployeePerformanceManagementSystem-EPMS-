package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.continuous.MeetingCommentRequest;
import ace.org.epms_backend.dto.continuous.MeetingCommentResponse;
import ace.org.epms_backend.dto.continuous.OneOnOneMeetingRequest;
import ace.org.epms_backend.dto.continuous.OneOnOneMeetingResponse;

import java.util.List;

public interface OneOnOneMeetingService {
    OneOnOneMeetingResponse scheduleMeeting(OneOnOneMeetingRequest request);
    OneOnOneMeetingResponse getMeetingById(Long meetingId);
    List<OneOnOneMeetingResponse> getMeetingsByEmployee(Long employeeId);
    List<OneOnOneMeetingResponse> getMeetingsByManager(Long managerId);
    List<OneOnOneMeetingResponse> getAllMeetings();
    OneOnOneMeetingResponse updateMeeting(Long meetingId, OneOnOneMeetingRequest request);
    void deleteMeeting(Long meetingId);

    MeetingCommentResponse addComment(Long meetingId, MeetingCommentRequest request);
    List<MeetingCommentResponse> getCommentsByMeetingId(Long meetingId);
    MeetingCommentResponse updateComment(Long commentId, MeetingCommentRequest request);
    void deleteComment(Long commentId);
}
