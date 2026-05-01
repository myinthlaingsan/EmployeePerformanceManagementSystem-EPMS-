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

        PerformanceHistory history = PerformanceHistory.builder()
                .employee(savedMeeting.getEmployee())
                .sourceType(SourceType.MEETING)
                .sourceId(savedMeeting.getMeetingId())
                .title("New 1-on-1 Meeting Scheduled")
                .description("Meeting scheduled for " + savedMeeting.getMeetingDate() + " at " + savedMeeting.getMeetingTime() + ". Agenda/Reason: " + (savedMeeting.getDiscussionPoints() != null ? savedMeeting.getDiscussionPoints() : "Not specified"))
                .isPrivate(savedMeeting.getIsPrivateNote())
                .createdBy(savedMeeting.getManager().getId())
                .manager(savedMeeting.getManager())
                .performer(savedMeeting.getManager())
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
        return meetingRepository.findByEmployeeId(employeeId).stream()
                .filter(m -> (currentUser.getId().equals(m.getManager().getId())) ||
                             (!Boolean.TRUE.equals(m.getIsPrivateNote()) && currentUser.getId().equals(m.getEmployee().getId())))
                .map(meetingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<OneOnOneMeetingResponse> getMeetingsByManager(Long managerId) {
        Employee currentUser = authService.getCurrentUser();
        return meetingRepository.findByManagerId(managerId).stream()
                .filter(m -> (currentUser.getId().equals(m.getManager().getId())) ||
                             (!Boolean.TRUE.equals(m.getIsPrivateNote()) && currentUser.getId().equals(m.getEmployee().getId())))
                .map(meetingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public OneOnOneMeetingResponse updateMeeting(Long meetingId, OneOnOneMeetingRequest request) {
        OneOnOneMeeting meeting = fetchMeeting(meetingId);
        checkMeetingModificationAccess(meeting);

        meetingMapper.updateEntityFromRequest(request, meeting);
        meeting.setEmployee(fetchEmployee(request.getEmployeeId()));
        meeting.setManager(fetchEmployee(request.getManagerId()));
        OneOnOneMeeting updatedMeeting = meetingRepository.save(meeting);

        PerformanceHistory history = PerformanceHistory.builder()
                .employee(updatedMeeting.getEmployee())
                .sourceType(SourceType.MEETING)
                .sourceId(updatedMeeting.getMeetingId())
                .title("1-on-1 Meeting Updated")
                .description("Meeting details were updated. Agenda/Reason: " + (updatedMeeting.getDiscussionPoints() != null ? updatedMeeting.getDiscussionPoints() : "Not specified"))
                .isPrivate(updatedMeeting.getIsPrivateNote())
                .createdBy(authService.getCurrentUser().getId())
                .manager(updatedMeeting.getManager())
                .performer(authService.getCurrentUser())
                .build();
        historyRepository.save(history);

        return meetingMapper.toResponse(updatedMeeting);
    }

    @Override
    public List<OneOnOneMeetingResponse> getAllMeetings() {
        Employee currentUser = authService.getCurrentUser();
        boolean isPrivilegedUser = isPrivileged(currentUser);

        return meetingRepository.findAll().stream()
                .filter(m -> currentUser.getId().equals(m.getManager().getId()) ||
                             (!Boolean.TRUE.equals(m.getIsPrivateNote()) && currentUser.getId().equals(m.getEmployee().getId())))
                .map(meetingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteMeeting(Long meetingId) {
        OneOnOneMeeting meeting = fetchMeeting(meetingId);
        checkMeetingModificationAccess(meeting);
        
        // Delete all comments first to avoid foreign key constraint violations
        List<MeetingComment> comments = commentRepository.findByMeetingMeetingId(meetingId);
        if (!comments.isEmpty()) {
            commentRepository.deleteAll(comments);
        }
        
        meetingRepository.delete(meeting);

        Employee currentUser = authService.getCurrentUser();
        PerformanceHistory history = PerformanceHistory.builder()
                .employee(meeting.getEmployee())
                .sourceType(SourceType.MEETING)
                .sourceId(meetingId)
                .title("Meeting Deleted")
                .description("Manager " + currentUser.getStaffName() + " deleted the 1-on-1 meeting.")
                .isPrivate(meeting.getIsPrivateNote())
                .createdBy(currentUser.getId())
                .manager(meeting.getManager())
                .performer(currentUser)
                .build();
        historyRepository.save(history);
    }

    @Override
    @Transactional
    public MeetingCommentResponse addComment(Long meetingId, MeetingCommentRequest request) {
        OneOnOneMeeting meeting = fetchMeeting(meetingId);
        checkMeetingAccess(meeting);

        Employee currentUser = authService.getCurrentUser();

        // Ensure the person commenting is the one who is logged in and matches the role
        if (request.getCommentType() == CommentType.MANAGER) {
            if (!currentUser.getId().equals(request.getManagerId())) {
                throw new AccessDeniedException("You can only comment as yourself.");
            }
            if (!currentUser.getId().equals(meeting.getManager().getId())) {
                throw new AccessDeniedException("You are not the manager of this meeting.");
            }
        } else if (request.getCommentType() == CommentType.EMPLOYEE) {
            if (!currentUser.getId().equals(request.getEmployeeId())) {
                throw new AccessDeniedException("You can only comment as yourself.");
            }
            if (!currentUser.getId().equals(meeting.getEmployee().getId())) {
                throw new AccessDeniedException("You are not the employee of this meeting.");
            }
        }

        MeetingComment comment = commentMapper.toEntity(request);
        comment.setMeeting(meeting);
        
        if (request.getCommentType() == CommentType.MANAGER) {
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
                .description((request.getCommentType() == CommentType.MANAGER ? "Manager " : "Employee ") + currentUser.getStaffName() + " commented: " + request.getComment())
                .isPrivate(meeting.getIsPrivateNote())
                .createdBy(currentUser.getId())
                .manager(meeting.getManager())
                .performer(currentUser)
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

    @Override
    @Transactional
    public MeetingCommentResponse updateComment(Long commentId, MeetingCommentRequest request) {
        MeetingComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("Comment not found"));
                
        Employee currentUser = authService.getCurrentUser();
        
        boolean isOwner = (comment.getManager() != null && comment.getManager().getId().equals(currentUser.getId())) ||
                (comment.getEmployee() != null && comment.getEmployee().getId().equals(currentUser.getId()));
                
        if (!isOwner && !isPrivileged(currentUser)) {
            throw new AccessDeniedException("You can only edit your own comments.");
        }

        comment.setComment(request.getComment());
        MeetingComment updatedComment = commentRepository.save(comment);

        PerformanceHistory history = PerformanceHistory.builder()
                .employee(comment.getMeeting().getEmployee())
                .sourceType(SourceType.MEETING)
                .sourceId(comment.getMeeting().getMeetingId())
                .title("Meeting Comment Updated")
                .description((isOwner ? "Owner " : "Admin ") + currentUser.getStaffName() + " updated comment to: " + request.getComment())
                .isPrivate(comment.getMeeting().getIsPrivateNote())
                .createdBy(currentUser.getId())
                .manager(comment.getMeeting().getManager())
                .performer(currentUser)
                .build();
        historyRepository.save(history);

        return commentMapper.toResponse(updatedComment);
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

        PerformanceHistory history = PerformanceHistory.builder()
                .employee(comment.getMeeting().getEmployee())
                .sourceType(SourceType.MEETING)
                .sourceId(comment.getMeeting().getMeetingId())
                .title("Meeting Comment Deleted")
                .description((comment.getManager() != null ? "Manager " : "Employee ") + currentUser.getStaffName() + " deleted their comment.")
                .isPrivate(comment.getMeeting().getIsPrivateNote())
                .createdBy(currentUser.getId())
                .manager(comment.getMeeting().getManager())
                .performer(currentUser)
                .build();
        historyRepository.save(history);
    }

    // --- Private Helper Methods ---

    private void checkMeetingAccess(OneOnOneMeeting meeting) {
        Employee currentUser = authService.getCurrentUser();
        
        // If private, only Manager can see
        if (Boolean.TRUE.equals(meeting.getIsPrivateNote())) {
            if (currentUser.getId().equals(meeting.getManager().getId())) {
                return;
            }
        } else {
            // If not private, both Manager and Employee can see
            if (currentUser.getId().equals(meeting.getEmployee().getId()) ||
                    currentUser.getId().equals(meeting.getManager().getId())) {
                return;
            }
        }

        throw new NotFoundException("Meeting not found");
    }

    private void checkMeetingModificationAccess(OneOnOneMeeting meeting) {
        Employee currentUser = authService.getCurrentUser();

        if (!currentUser.getId().equals(meeting.getManager().getId())) {
            throw new AccessDeniedException("You do not have permission to modify this meeting.");
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



    private OneOnOneMeeting fetchMeeting(Long meetingId) {
        return meetingRepository.findById(meetingId)
                .orElseThrow(() -> new NotFoundException("Meeting not found with id: " + meetingId));
    }

    private Employee fetchEmployee(Long employeeId) {
        return employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Employee not found with id: " + employeeId));
    }
}