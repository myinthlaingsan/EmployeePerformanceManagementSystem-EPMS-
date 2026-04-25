package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.continuous.MeetingCommentRequest;
import ace.org.epms_backend.dto.continuous.MeetingCommentResponse;
import ace.org.epms_backend.dto.continuous.OneOnOneMeetingRequest;
import ace.org.epms_backend.dto.continuous.OneOnOneMeetingResponse;
import ace.org.epms_backend.enums.CommentType;
import ace.org.epms_backend.enums.RoleType;
import ace.org.epms_backend.enums.SourceType;
import ace.org.epms_backend.exception.AccessDeniedException;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.continuous.MeetingCommentMapper;
import ace.org.epms_backend.mapper.continuous.OneOnOneMeetingMapper;
import ace.org.epms_backend.model.continuous.MeetingComment;
import ace.org.epms_backend.model.continuous.OneOnOneMeeting;
import ace.org.epms_backend.model.continuous.PerformanceHistory;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.Role;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.EmployeeRoleRepository;
import ace.org.epms_backend.repository.MeetingCommentRepository;
import ace.org.epms_backend.repository.OneOnOneMeetingRepository;
import ace.org.epms_backend.repository.PerformanceHistoryRepository;
import ace.org.epms_backend.service.AuthService;
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
    private final PerformanceHistoryRepository historyRepository;
    private final AuthService authService;
    private final EmployeeRoleRepository employeeRoleRepository;

    @Override
    public OneOnOneMeetingResponse scheduleMeeting(OneOnOneMeetingRequest request) {
        OneOnOneMeeting meeting = meetingMapper.toEntity(request);
        meeting.setEmployee(fetchEmployee(request.getEmployeeId()));
        meeting.setManager(fetchEmployee(request.getManagerId()));
        OneOnOneMeeting savedMeeting = meetingRepository.save(meeting);

        savePerformanceHistory(
                savedMeeting,
                "New 1-on-1 Meeting Scheduled",
                "Meeting scheduled for " + savedMeeting.getMeetingDate(),
                savedMeeting.getManager().getId()
        );

        return meetingMapper.toResponse(savedMeeting);
    }

    @Override
    public OneOnOneMeetingResponse getMeetingById(Long meetingId) {
        OneOnOneMeeting meeting = fetchMeeting(meetingId);
        checkMeetingAccess(meeting);
        return meetingMapper.toResponse(meeting);
    }

    @Override
    public List<OneOnOneMeetingResponse> getMeetingsByEmployee(Long employeeId) {
        Employee currentUser = authService.getCurrentUser();
        return meetingRepository.findByEmployeeId(employeeId).stream()
                .filter(m -> isParticipant(m, currentUser) || isPrivileged(currentUser))
                .map(meetingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<OneOnOneMeetingResponse> getMeetingsByManager(Long managerId) {
        Employee currentUser = authService.getCurrentUser();
        return meetingRepository.findByManagerId(managerId).stream()
                .filter(m -> isParticipant(m, currentUser) || isPrivileged(currentUser))
                .map(meetingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public OneOnOneMeetingResponse updateMeeting(Long meetingId, OneOnOneMeetingRequest request) {
        OneOnOneMeeting meeting = fetchMeeting(meetingId);
        checkMeetingAccess(meeting);

        meetingMapper.updateEntityFromRequest(request, meeting);
        meeting.setEmployee(fetchEmployee(request.getEmployeeId()));
        meeting.setManager(fetchEmployee(request.getManagerId()));
        OneOnOneMeeting updatedMeeting = meetingRepository.save(meeting);

        savePerformanceHistory(
                updatedMeeting,
                "1-on-1 Meeting Updated",
                "Meeting details were updated.",
                authService.getCurrentUser().getId()
        );

        return meetingMapper.toResponse(updatedMeeting);
    }

    @Override
    public void deleteMeeting(Long meetingId) {
        OneOnOneMeeting meeting = fetchMeeting(meetingId);
        checkMeetingAccess(meeting);
        meetingRepository.delete(meeting);
    }

    @Override
    public MeetingCommentResponse addComment(Long meetingId, MeetingCommentRequest request) {
        OneOnOneMeeting meeting = fetchMeeting(meetingId);
        Employee currentUser = authService.getCurrentUser();

        MeetingComment comment = commentMapper.toEntity(request);
        comment.setMeeting(meeting);

        // STRICTOR AUTHORIZATION: Only actual participants can comment
        if (currentUser.getId().equals(meeting.getManager().getId())) {
            comment.setManager(currentUser);
            comment.setEmployee(null);
            comment.setCommentType(CommentType.MANAGER);
        } else if (currentUser.getId().equals(meeting.getEmployee().getId())) {
            comment.setEmployee(currentUser);
            comment.setManager(null);
            comment.setCommentType(CommentType.EMPLOYEE);
        } else {
            throw new AccessDeniedException("You are not authorized to comment on this meeting.");
        }

        MeetingComment savedComment = commentRepository.save(comment);

        savePerformanceHistory(
                meeting,
                "New Comment in Meeting",
                currentUser.getStaffName() + " added a comment.",
                currentUser.getId()
        );

        return commentMapper.toResponse(savedComment);
    }

    @Override
    public List<MeetingCommentResponse> getCommentsByMeetingId(Long meetingId) {
        OneOnOneMeeting meeting = fetchMeeting(meetingId);
        checkMeetingAccess(meeting);

        return commentRepository.findByMeetingMeetingId(meetingId).stream()
                .map(commentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteComment(Long commentId) {
        MeetingComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("Comment not found"));

        Employee currentUser = authService.getCurrentUser();

        // Ensure user is the owner of the comment
        boolean isOwner = (comment.getManager() != null && comment.getManager().getId().equals(currentUser.getId())) ||
                (comment.getEmployee() != null && comment.getEmployee().getId().equals(currentUser.getId()));

        if (!isOwner) {
            throw new AccessDeniedException("You can only delete your own comments.");
        }

        commentRepository.delete(comment);
    }

    // --- Private Helper Methods ---

    private void checkMeetingAccess(OneOnOneMeeting meeting) {
        Employee currentUser = authService.getCurrentUser();
        if (!isParticipant(meeting, currentUser) && !isPrivileged(currentUser)) {
            // Throw NotFound instead of AccessDenied to prevent resource leakage
            throw new NotFoundException("Meeting not found");
        }
    }

    private boolean isParticipant(OneOnOneMeeting meeting, Employee user) {
        return user.getId().equals(meeting.getEmployee().getId()) ||
                user.getId().equals(meeting.getManager().getId());
    }

    private boolean isPrivileged(Employee employee) {
        List<Role> roles = employeeRoleRepository.findRolesByEmployeeId(employee.getId());
        return roles.stream()
                .anyMatch(r -> r.getRoleName() == RoleType.ADMIN || r.getRoleName() == RoleType.HR);
    }

    private void savePerformanceHistory(OneOnOneMeeting meeting, String title, String description, Long creatorId) {
        PerformanceHistory history = PerformanceHistory.builder()
                .employee(meeting.getEmployee())
                .sourceType(SourceType.MEETING)
                .sourceId(meeting.getMeetingId())
                .title(title)
                .description(description)
                .isPrivate(meeting.getIsPrivateNote())
                .createdBy(creatorId)
                .build();
        historyRepository.save(history);
    }

    private OneOnOneMeeting fetchMeeting(Long meetingId) {
        return meetingRepository.findById(meetingId)
                .orElseThrow(() -> new NotFoundException("Meeting not found with id: " + meetingId));
    }

    private Employee fetchEmployee(Long employeeId) {
        return employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Employee not found with id: " + employeeId));
    }
}