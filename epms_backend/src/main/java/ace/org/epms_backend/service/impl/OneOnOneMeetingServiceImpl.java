package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.continuous.MeetingCommentRequest;
import ace.org.epms_backend.dto.continuous.MeetingCommentResponse;
import ace.org.epms_backend.dto.continuous.OneOnOneMeetingRequest;
import ace.org.epms_backend.dto.continuous.OneOnOneMeetingResponse;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.continuous.MeetingCommentMapper;
import ace.org.epms_backend.mapper.continuous.OneOnOneMeetingMapper;
import ace.org.epms_backend.model.continuous.MeetingComment;
import ace.org.epms_backend.model.continuous.OneOnOneMeeting;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.MeetingCommentRepository;
import ace.org.epms_backend.repository.OneOnOneMeetingRepository;
import ace.org.epms_backend.repository.PerformanceHistoryRepository;
import ace.org.epms_backend.enums.SourceType;
import ace.org.epms_backend.model.continuous.PerformanceHistory;
import ace.org.epms_backend.service.OneOnOneMeetingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ace.org.epms_backend.service.AuthService;
import ace.org.epms_backend.repository.EmployeeRoleRepository;
import ace.org.epms_backend.enums.RoleType;
import ace.org.epms_backend.exception.AccessDeniedException;
import ace.org.epms_backend.model.employee.Role;
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

        // Update PerformanceHistory
        PerformanceHistory history = PerformanceHistory.builder()
                .employee(savedMeeting.getEmployee())
                .sourceType(SourceType.MEETING)
                .sourceId(savedMeeting.getMeetingId())
                .title("New 1-on-1 Meeting Scheduled")
                .description("Meeting scheduled for " + savedMeeting.getMeetingDate() + " at " + savedMeeting.getMeetingTime())
                .isPrivate(savedMeeting.getIsPrivateNote())
                .createdBy(savedMeeting.getManager().getId())
                .build();
        historyRepository.save(history);

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
        boolean isPrivileged = isPrivileged(currentUser);

        return meetingRepository.findByEmployeeId(employeeId).stream()
                .filter(m -> !Boolean.TRUE.equals(m.getIsPrivateNote()) ||
                        isPrivileged ||
                        currentUser.getId().equals(m.getEmployee().getId()) ||
                        currentUser.getId().equals(m.getManager().getId()))
                .map(meetingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<OneOnOneMeetingResponse> getMeetingsByManager(Long managerId) {
        Employee currentUser = authService.getCurrentUser();
        boolean isPrivileged = isPrivileged(currentUser);

        return meetingRepository.findByManagerId(managerId).stream()
                .filter(m -> !Boolean.TRUE.equals(m.getIsPrivateNote()) ||
                        isPrivileged ||
                        currentUser.getId().equals(m.getEmployee().getId()) ||
                        currentUser.getId().equals(m.getManager().getId()))
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

        // Update PerformanceHistory
        PerformanceHistory history = PerformanceHistory.builder()
                .employee(updatedMeeting.getEmployee())
                .sourceType(SourceType.MEETING)
                .sourceId(updatedMeeting.getMeetingId())
                .title("1-on-1 Meeting Updated")
                .description("Meeting details were updated.")
                .isPrivate(updatedMeeting.getIsPrivateNote())
                .createdBy(updatedMeeting.getManager().getId())
                .build();
        historyRepository.save(history);

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
        checkMeetingAccess(meeting);

        Employee currentUser = authService.getCurrentUser();
        // Restriction: Only assigned manager or employee can comment
        if (!currentUser.getId().equals(meeting.getEmployee().getId()) && 
            !currentUser.getId().equals(meeting.getManager().getId())) {
            throw new AccessDeniedException("Only the assigned manager and employee have permission to comment on this meeting.");
        }

        MeetingComment comment = commentMapper.toEntity(request);
        comment.setMeeting(meeting);
        
        // Attributing the comment to the currentUser correctly
        if (currentUser.getId().equals(meeting.getManager().getId())) {
            comment.setManager(currentUser);
            comment.setEmployee(null);
        } else {
            comment.setEmployee(currentUser);
            comment.setManager(null);
        }
        
        MeetingComment savedComment = commentRepository.save(comment);

        // Update PerformanceHistory
        PerformanceHistory history = PerformanceHistory.builder()
                .employee(meeting.getEmployee())
                .sourceType(SourceType.MEETING)
                .sourceId(meeting.getMeetingId())
                .title("New Comment in Meeting")
                .description(currentUser.getStaffName() + " added a comment.")
                .isPrivate(meeting.getIsPrivateNote())
                .createdBy(currentUser.getId())
                .build();
        historyRepository.save(history);

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

    private void checkMeetingAccess(OneOnOneMeeting meeting) {
        if (Boolean.TRUE.equals(meeting.getIsPrivateNote())) {
            Employee currentUser = authService.getCurrentUser();

            if (currentUser.getId().equals(meeting.getEmployee().getId()) ||
                    currentUser.getId().equals(meeting.getManager().getId())) {
                return;
            }

            if (!isPrivileged(currentUser)) {
                throw new NotFoundException("Meeting not found");
            }
        }
    }

    private boolean isPrivileged(Employee employee) {
        List<Role> roles = employeeRoleRepository.findRolesByEmployeeId(employee.getId());
        return roles.stream()
                .anyMatch(r -> r.getRoleName() == RoleType.ADMIN || r.getRoleName() == RoleType.HR);
    }

    @Override
    public void deleteComment(Long commentId) {
        MeetingComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("Comment not found with id: " + commentId));
        commentRepository.delete(comment);
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
