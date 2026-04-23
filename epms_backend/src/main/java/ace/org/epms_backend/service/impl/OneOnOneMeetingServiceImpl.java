package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.continuous.MeetingCommentRequest;
import ace.org.epms_backend.dto.continuous.MeetingCommentResponse;
import ace.org.epms_backend.dto.continuous.OneOnOneMeetingRequest;
import ace.org.epms_backend.dto.continuous.OneOnOneMeetingResponse;
import ace.org.epms_backend.exception.ResourceNotFoundException;
import ace.org.epms_backend.mapper.continuous.MeetingCommentMapper;
import ace.org.epms_backend.mapper.continuous.OneOnOneMeetingMapper;
import ace.org.epms_backend.model.continuous.MeetingComment;
import ace.org.epms_backend.model.continuous.OneOnOneMeeting;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.MeetingCommentRepository;
import ace.org.epms_backend.repository.OneOnOneMeetingRepository;
import ace.org.epms_backend.service.OneOnOneMeetingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class OneOnOneMeetingServiceImpl implements OneOnOneMeetingService {

    private final OneOnOneMeetingRepository meetingRepository;
    private final MeetingCommentRepository commentRepository;
    private final EmployeeRepository employeeRepository;
    private final OneOnOneMeetingMapper meetingMapper;
    private final MeetingCommentMapper commentMapper;

    @Override
    public OneOnOneMeetingResponse scheduleMeeting(OneOnOneMeetingRequest request) {
        OneOnOneMeeting meeting = meetingMapper.toEntity(request);
        meeting.setEmployee(fetchEmployee(request.getEmployeeId()));
        meeting.setManager(fetchEmployee(request.getManagerId()));
        OneOnOneMeeting savedMeeting = meetingRepository.save(meeting);
        return meetingMapper.toResponse(savedMeeting);
    }

    @Override
    public OneOnOneMeetingResponse getMeetingById(Long meetingId) {
        OneOnOneMeeting meeting = fetchMeeting(meetingId);
        return meetingMapper.toResponse(meeting);
    }

    @Override
    public List<OneOnOneMeetingResponse> getMeetingsByEmployee(Long employeeId) {
        return meetingRepository.findByEmployeeId(employeeId).stream()
                .map(meetingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<OneOnOneMeetingResponse> getMeetingsByManager(Long managerId) {
        return meetingRepository.findByManagerId(managerId).stream()
                .map(meetingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public OneOnOneMeetingResponse updateMeeting(Long meetingId, OneOnOneMeetingRequest request) {
        OneOnOneMeeting meeting = fetchMeeting(meetingId);
        meetingMapper.updateEntityFromRequest(request, meeting);
        meeting.setEmployee(fetchEmployee(request.getEmployeeId()));
        meeting.setManager(fetchEmployee(request.getManagerId()));
        OneOnOneMeeting updatedMeeting = meetingRepository.save(meeting);
        return meetingMapper.toResponse(updatedMeeting);
    }

    @Override
    public void deleteMeeting(Long meetingId) {
        OneOnOneMeeting meeting = fetchMeeting(meetingId);
        meetingRepository.delete(meeting);
    }

    @Override
    public MeetingCommentResponse addComment(Long meetingId, MeetingCommentRequest request) {
        OneOnOneMeeting meeting = fetchMeeting(meetingId);
        MeetingComment comment = commentMapper.toEntity(request);
        comment.setMeeting(meeting);
        
        if (request.getEmployeeId() != null) {
            comment.setEmployee(fetchEmployee(request.getEmployeeId()));
        }
        if (request.getManagerId() != null) {
            comment.setManager(fetchEmployee(request.getManagerId()));
        }
        
        MeetingComment savedComment = commentRepository.save(comment);
        return commentMapper.toResponse(savedComment);
    }

    @Override
    public List<MeetingCommentResponse> getCommentsByMeetingId(Long meetingId) {
        return commentRepository.findByMeetingMeetingId(meetingId).stream()
                .map(commentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteComment(Long commentId) {
        MeetingComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));
        commentRepository.delete(comment);
    }

    private OneOnOneMeeting fetchMeeting(Long meetingId) {
        return meetingRepository.findById(meetingId)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found with id: " + meetingId));
    }

    private Employee fetchEmployee(Long employeeId) {
        return employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));
    }
}
