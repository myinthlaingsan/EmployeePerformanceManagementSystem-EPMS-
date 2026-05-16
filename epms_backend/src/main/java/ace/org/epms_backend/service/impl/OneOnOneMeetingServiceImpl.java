package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.enums.ContinuousStatus;
import ace.org.epms_backend.dto.continuous.MeetingCommentRequest;
import ace.org.epms_backend.dto.continuous.MeetingCommentResponse;
import ace.org.epms_backend.dto.continuous.OneOnOneMeetingRequest;
import ace.org.epms_backend.dto.continuous.OneOnOneMeetingResponse;
import ace.org.epms_backend.enums.CommentType;
import ace.org.epms_backend.enums.RoleType;
import ace.org.epms_backend.enums.FeedbackType;
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
import ace.org.epms_backend.repository.MeetingActionItemRepository;
import ace.org.epms_backend.service.AuthService;
import ace.org.epms_backend.service.OneOnOneMeetingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.context.ApplicationEventPublisher;
import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;

@Service
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
    private final MeetingActionItemRepository actionItemRepository;
    private final ApplicationEventPublisher eventPublisher;

    public OneOnOneMeetingServiceImpl(
            OneOnOneMeetingRepository meetingRepository,
            MeetingCommentRepository commentRepository,
            EmployeeRepository employeeRepository,
            OneOnOneMeetingMapper meetingMapper,
            MeetingCommentMapper commentMapper,
            PerformanceHistoryRepository historyRepository,
            AuthService authService,
            EmployeeRoleRepository employeeRoleRepository,
            MeetingActionItemRepository actionItemRepository,
            ApplicationEventPublisher eventPublisher) {
        this.meetingRepository = meetingRepository;
        this.commentRepository = commentRepository;
        this.employeeRepository = employeeRepository;
        this.meetingMapper = meetingMapper;
        this.commentMapper = commentMapper;
        this.historyRepository = historyRepository;
        this.authService = authService;
        this.employeeRoleRepository = employeeRoleRepository;
        this.actionItemRepository = actionItemRepository;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public OneOnOneMeetingResponse scheduleMeeting(OneOnOneMeetingRequest request) {
        OneOnOneMeeting meeting = meetingMapper.toEntity(request);
        meeting.setEmployee(fetchEmployee(request.getEmployeeId()));
        meeting.setManager(fetchEmployee(request.getManagerId()));

        // Save first to generate the meeting ID, then add action items
        OneOnOneMeeting savedMeeting = meetingRepository.save(meeting);

        syncActionItems(savedMeeting, request.getActionItems());
        savedMeeting = meetingRepository.save(savedMeeting);

        // Update PerformanceHistory (only if PUBLISHED)
        if (savedMeeting.getStatus() == ContinuousStatus.PUBLISHED) {
            PerformanceHistory history = PerformanceHistory.builder()
                    .employee(savedMeeting.getEmployee())
                    .sourceType(SourceType.MEETING)
                    .sourceId(savedMeeting.getMeetingId())
                    .title("New 1-on-1 Meeting Scheduled")
                    .createdBy(savedMeeting.getManager().getId())
                    .manager(savedMeeting.getManager())
                    .performer(savedMeeting.getManager())
                    .build();
            historyRepository.save(history);
        }

        // Notify Employee (if PUBLISHED)
        if (savedMeeting.getStatus() == ContinuousStatus.PUBLISHED) {
            eventPublisher.publishEvent(NotificationEvent.builder()
                    .recipientId(savedMeeting.getEmployee().getId())
                    .senderId(savedMeeting.getManager().getId())
                    .type(NotificationType.MEETING_SCHEDULED)
                    .title("New 1-on-1 Meeting Scheduled")
                    .message("Manager " + savedMeeting.getManager().getStaffName() + " scheduled a meeting on "
                            + savedMeeting.getMeetingDate())
                    .referenceType(ReferenceType.MEETING)
                    .referenceId(savedMeeting.getMeetingId())
                    .actionUrl("/meetings")
                    .build());
        }

        return meetingMapper.toResponse(savedMeeting);
    }

    @Override
    public OneOnOneMeetingResponse getMeetingById(Long meetingId) {
        OneOnOneMeeting meeting = fetchMeeting(meetingId);
        checkMeetingAccess(meeting);
        return meetingMapper.toResponse(meeting);
    }

    @Override
    public ace.org.epms_backend.dto.PagedResponse<OneOnOneMeetingResponse> getMeetingsByEmployee(Long employeeId,
            int page, int size) {
        checkNotPurePrivileged();
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size,
                org.springframework.data.domain.Sort.by("createdAt").descending());
        Employee currentUser = authService.getCurrentUser();

        org.springframework.data.domain.Page<OneOnOneMeeting> meetingPage = meetingRepository
                .findVisibleMeetingsByEmployee(employeeId, currentUser.getId(), pageable);

        List<OneOnOneMeetingResponse> content = meetingPage.getContent().stream()
                .map(meetingMapper::toResponse)
                .collect(Collectors.toList());

        return new ace.org.epms_backend.dto.PagedResponse<>(
                content,
                meetingPage.getNumber(),
                meetingPage.getSize(),
                meetingPage.getTotalElements(),
                meetingPage.getTotalPages(),
                meetingPage.isLast());
    }

    @Override
    public ace.org.epms_backend.dto.PagedResponse<OneOnOneMeetingResponse> getMeetingsByManager(Long managerId,
            ace.org.epms_backend.enums.ContinuousStatus status, int page, int size) {
        checkNotPurePrivileged();
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size,
                org.springframework.data.domain.Sort.by("createdAt").descending());
        Employee currentUser = authService.getCurrentUser();

        org.springframework.data.domain.Page<OneOnOneMeeting> meetingPage = meetingRepository
                .findVisibleMeetingsByManager(managerId, currentUser.getId(), status, pageable);

        List<OneOnOneMeetingResponse> content = meetingPage.getContent().stream()
                .map(meetingMapper::toResponse)
                .collect(Collectors.toList());

        return new ace.org.epms_backend.dto.PagedResponse<>(
                content,
                meetingPage.getNumber(),
                meetingPage.getSize(),
                meetingPage.getTotalElements(),
                meetingPage.getTotalPages(),
                meetingPage.isLast());
    }

    @Override
    public OneOnOneMeetingResponse updateMeeting(Long meetingId, OneOnOneMeetingRequest request) {
        OneOnOneMeeting meeting = fetchMeeting(meetingId);
        checkMeetingModificationAccess(meeting);
        meetingMapper.updateEntityFromRequest(request, meeting);
        meeting.setEmployee(fetchEmployee(request.getEmployeeId()));
        meeting.setManager(fetchEmployee(request.getManagerId()));

        if (request.getActionItems() != null) {
            syncActionItems(meeting, request.getActionItems());
        }

        OneOnOneMeeting updatedMeeting = meetingRepository.save(meeting);

        // Only log history if PUBLISHED
        if (updatedMeeting.getStatus() == ContinuousStatus.PUBLISHED) {
            PerformanceHistory history = PerformanceHistory.builder()
                    .employee(updatedMeeting.getEmployee())
                    .sourceType(SourceType.MEETING)
                    .sourceId(updatedMeeting.getMeetingId())
                    .title("1-on-1 Meeting Updated")
                    .createdBy(authService.getCurrentUser().getId())
                    .manager(updatedMeeting.getManager())
                    .performer(authService.getCurrentUser())
                    .build();
            historyRepository.save(history);
        }

        // Notify Employee (if PUBLISHED)
        if (updatedMeeting.getStatus() == ContinuousStatus.PUBLISHED) {
            eventPublisher.publishEvent(NotificationEvent.builder()
                    .recipientId(updatedMeeting.getEmployee().getId())
                    .senderId(authService.getCurrentUser().getId())
                    .type(NotificationType.MEETING_UPDATED)
                    .title("Meeting Updated")
                    .message("Manager " + authService.getCurrentUser().getStaffName() + " updated the meeting details.")
                    .referenceType(ReferenceType.MEETING)
                    .referenceId(updatedMeeting.getMeetingId())
                    .actionUrl("/meetings")
                    .build());
        }

        return meetingMapper.toResponse(updatedMeeting);
    }

    @Override
    public ace.org.epms_backend.dto.PagedResponse<OneOnOneMeetingResponse> getAllMeetings(
            ace.org.epms_backend.enums.ContinuousStatus status, int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size,
                org.springframework.data.domain.Sort.by("createdAt").descending());
        Employee currentUser = authService.getCurrentUser();

        org.springframework.data.domain.Page<OneOnOneMeeting> meetingPage = meetingRepository
                .findAllVisibleMeetings(currentUser.getId(), status, pageable);

        List<OneOnOneMeetingResponse> content = meetingPage.getContent().stream()
                .map(meetingMapper::toResponse)
                .collect(Collectors.toList());

        return new ace.org.epms_backend.dto.PagedResponse<>(
                content,
                meetingPage.getNumber(),
                meetingPage.getSize(),
                meetingPage.getTotalElements(),
                meetingPage.getTotalPages(),
                meetingPage.isLast());
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

        // Only log deletion to history if the meeting was PUBLISHED.
        if (meeting.getStatus() == ContinuousStatus.PUBLISHED) {
            PerformanceHistory history = PerformanceHistory.builder()
                    .employee(meeting.getEmployee())
                    .sourceType(SourceType.MEETING)
                    .sourceId(meetingId)
                    .title("Meeting Deleted")
                    .description("Manager " + currentUser.getStaffName() + " deleted the 1-on-1 meeting.")
                    .createdBy(currentUser.getId())
                    .manager(meeting.getManager())
                    .performer(currentUser)
                    .build();
            historyRepository.save(history);
        }

        // Notify Employee (if PUBLISHED)
        if (meeting.getStatus() == ContinuousStatus.PUBLISHED) {
            eventPublisher.publishEvent(NotificationEvent.builder()
                    .recipientId(meeting.getEmployee().getId())
                    .senderId(currentUser.getId())
                    .type(NotificationType.SYSTEM)
                    .title("Meeting Deleted")
                    .message("Manager " + currentUser.getStaffName() + " deleted the 1-on-1 meeting.")
                    .referenceType(ReferenceType.MEETING)
                    .referenceId(meetingId)
                    .actionUrl("/meetings")
                    .build());
        }
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
        if (request.getParentId() != null) {
            comment.setParentId(request.getParentId());
        }

        if (request.getCommentType() == CommentType.MANAGER) {
            comment.setManager(currentUser);
            comment.setEmployee(null);
        } else {
            comment.setEmployee(currentUser);
            comment.setManager(null);
        }

        MeetingComment savedComment = commentRepository.save(comment);

        // Update PerformanceHistory (only if PUBLISHED)
        if (meeting.getStatus() == ContinuousStatus.PUBLISHED) {
            PerformanceHistory history = PerformanceHistory.builder()
                    .employee(meeting.getEmployee())
                    .sourceType(SourceType.MEETING)
                    .sourceId(meeting.getMeetingId())
                    .title("New Comment in Meeting")
                    .description((request.getCommentType() == CommentType.MANAGER ? "Manager " : "Employee ")
                            + currentUser.getStaffName() + " commented: " + request.getComment())
                    .createdBy(currentUser.getId())
                    .manager(meeting.getManager())
                    .performer(currentUser)
                    .build();
            historyRepository.save(history);
        }

        // Notify the other party (only if meeting is PUBLISHED)
        if (meeting.getStatus() == ContinuousStatus.PUBLISHED) {
            Long recipientId = currentUser.getId().equals(meeting.getManager().getId())
                    ? meeting.getEmployee().getId()
                    : meeting.getManager().getId();

            eventPublisher.publishEvent(NotificationEvent.builder()
                    .recipientId(recipientId)
                    .senderId(currentUser.getId())
                    .type(NotificationType.COMMENT_ADDED)
                    .title("New Comment in Meeting")
                    .message(currentUser.getStaffName() + " commented: " + request.getComment())
                    .referenceType(ReferenceType.MEETING)
                    .referenceId(meeting.getMeetingId())
                    .actionUrl("/meetings")
                    .build());
        }

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

        // Update PerformanceHistory (only if PUBLISHED)
        if (comment.getMeeting().getStatus() == ContinuousStatus.PUBLISHED) {
            PerformanceHistory history = PerformanceHistory.builder()
                    .employee(comment.getMeeting().getEmployee())
                    .sourceType(SourceType.MEETING)
                    .sourceId(comment.getMeeting().getMeetingId())
                    .title("Meeting Comment Updated")
                    .description(currentUser.getStaffName() + " updated their comment.")
                    .createdBy(currentUser.getId())
                    .manager(comment.getMeeting().getManager())
                    .performer(currentUser)
                    .build();
            historyRepository.save(history);
        }

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

        // Update PerformanceHistory (only if PUBLISHED)
        if (comment.getMeeting().getStatus() == ContinuousStatus.PUBLISHED) {
            PerformanceHistory history = PerformanceHistory.builder()
                    .employee(comment.getMeeting().getEmployee())
                    .sourceType(SourceType.MEETING)
                    .sourceId(comment.getMeeting().getMeetingId())
                    .title("Meeting Comment Deleted")
                    .description(currentUser.getStaffName() + " deleted their comment.")
                    .createdBy(currentUser.getId())
                    .manager(comment.getMeeting().getManager())
                    .performer(currentUser)
                    .build();
            historyRepository.save(history);
        }
    }

    @Override
    @Transactional
    public OneOnOneMeetingResponse publishMeeting(Long meetingId) {
        OneOnOneMeeting meeting = fetchMeeting(meetingId);
        checkMeetingAccess(meeting);

        if (meeting.getStatus() == ContinuousStatus.PUBLISHED) {
            throw new IllegalStateException("Meeting is already published.");
        }

        meeting.setStatus(ContinuousStatus.PUBLISHED);
        OneOnOneMeeting publishedMeeting = meetingRepository.save(meeting);

        // Update PerformanceHistory for publishing
        PerformanceHistory history = PerformanceHistory.builder()
                .employee(publishedMeeting.getEmployee())
                .sourceType(SourceType.MEETING)
                .sourceId(publishedMeeting.getMeetingId())
                .title("1-on-1 Meeting Published")
                .createdBy(authService.getCurrentUser().getId())
                .manager(publishedMeeting.getManager())
                .performer(authService.getCurrentUser())
                .build();
        historyRepository.save(history);

        // Notify Employee
        eventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(publishedMeeting.getEmployee().getId())
                .senderId(publishedMeeting.getManager().getId())
                .type(NotificationType.MEETING_SCHEDULED)
                .title("Meeting Published")
                .message("Manager " + publishedMeeting.getManager().getStaffName() + " published a meeting scheduled for " + publishedMeeting.getMeetingDate())
                .referenceType(ReferenceType.MEETING)
                .referenceId(publishedMeeting.getMeetingId())
                .actionUrl("/meetings")
                .build());

        return meetingMapper.toResponse(publishedMeeting);
    }

    @Override
    public ace.org.epms_backend.dto.continuous.ContinuousStatsResponse getMeetingStats(Long employeeId) {
        long published = meetingRepository.countByEmployee_IdAndStatus(employeeId, ace.org.epms_backend.enums.ContinuousStatus.PUBLISHED);
        long draft = meetingRepository.countByEmployee_IdAndStatus(employeeId, ace.org.epms_backend.enums.ContinuousStatus.DRAFT);

        return ace.org.epms_backend.dto.continuous.ContinuousStatsResponse.builder()
                .totalPublished(published)
                .totalDraft(draft)
                .build();
    }

    @Override
    public ace.org.epms_backend.dto.continuous.ContinuousStatsResponse getMeetingStatsForManager(Long managerId) {
        long published = meetingRepository.countByManager_IdAndStatus(managerId, ace.org.epms_backend.enums.ContinuousStatus.PUBLISHED);
        long draft = meetingRepository.countByManager_IdAndStatus(managerId, ace.org.epms_backend.enums.ContinuousStatus.DRAFT);

        return ace.org.epms_backend.dto.continuous.ContinuousStatsResponse.builder()
                .totalPublished(published)
                .totalDraft(draft)
                .build();
    }

    @Override
    @Transactional
    public void updateActionItemStatus(Long meetingId, Long itemId, ace.org.epms_backend.enums.ActionItemStatus status) {
        OneOnOneMeeting meeting = fetchMeeting(meetingId);
        Employee currentUser = authService.getCurrentUser();
        if (!currentUser.getId().equals(meeting.getEmployee().getId()) && !currentUser.getId().equals(meeting.getManager().getId())) {
            throw new AccessDeniedException("You do not have permission to update action item status.");
        }

        ace.org.epms_backend.model.continuous.MeetingActionItem item = actionItemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Action item not found"));

        if (!item.getMeeting().getMeetingId().equals(meetingId)) {
            throw new IllegalArgumentException("Action item does not belong to this meeting.");
        }

        item.setStatus(status);
        if (status == ace.org.epms_backend.enums.ActionItemStatus.DONE) {
            item.setCompletedAt(java.time.LocalDateTime.now());
        } else {
            item.setCompletedAt(null);
        }
        actionItemRepository.save(item);

        // Notify Manager if Employee completes an item (only if meeting is PUBLISHED)
        if (meeting.getStatus() == ContinuousStatus.PUBLISHED && status == ace.org.epms_backend.enums.ActionItemStatus.DONE && currentUser.getId().equals(meeting.getEmployee().getId())) {
            eventPublisher.publishEvent(NotificationEvent.builder()
                    .recipientId(meeting.getManager().getId())
                    .senderId(currentUser.getId())
                    .type(NotificationType.ACTION_ITEM_COMPLETED)
                    .title("Action Item Completed")
                    .message("Employee " + currentUser.getStaffName() + " completed an action item: " + item.getContent())
                    .referenceType(ReferenceType.MEETING)
                    .referenceId(meeting.getMeetingId())
                    .actionUrl("/meetings")
                    .build());
        }
    }

    @Override
    @Transactional
    public void reopenActionItem(Long meetingId, Long itemId, String reason) {
        OneOnOneMeeting meeting = fetchMeeting(meetingId);
        Employee currentUser = authService.getCurrentUser();

        // Only manager can re-open
        if (!currentUser.getId().equals(meeting.getManager().getId())) {
            throw new AccessDeniedException("Only the manager can re-open an action item.");
        }

        ace.org.epms_backend.model.continuous.MeetingActionItem item = actionItemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Action item not found"));

        if (!item.getMeeting().getMeetingId().equals(meetingId)) {
            throw new IllegalArgumentException("Action item does not belong to this meeting.");
        }

        item.setStatus(ace.org.epms_backend.enums.ActionItemStatus.PENDING);
        item.setReopenReason(reason);
        item.setReopenedAt(java.time.LocalDateTime.now());
        item.setCompletedAt(null);
        actionItemRepository.save(item);

        // Notify Employee (only if meeting is PUBLISHED)
        if (meeting.getStatus() == ContinuousStatus.PUBLISHED) {
            eventPublisher.publishEvent(NotificationEvent.builder()
                    .recipientId(meeting.getEmployee().getId())
                    .senderId(currentUser.getId())
                    .type(NotificationType.MEETING_UPDATED)
                    .title("Action Item Re-opened")
                    .message("Manager " + currentUser.getStaffName() + " re-opened an action item: " + item.getContent())
                    .referenceType(ReferenceType.MEETING)
                    .referenceId(meeting.getMeetingId())
                    .actionUrl("/meetings")
                    .build());

            // Log to Performance History
            PerformanceHistory history = PerformanceHistory.builder()
                    .employee(meeting.getEmployee())
                    .sourceType(SourceType.MEETING)
                    .sourceId(meeting.getMeetingId())
                    .title("Action Item Re-opened")
                    .description("Manager " + currentUser.getStaffName() + " re-opened an action item: " + item.getContent())
                    .createdBy(currentUser.getId())
                    .manager(meeting.getManager())
                    .performer(currentUser)
                    .build();
            historyRepository.save(history);
        }
    }

    // --- Private Helper Methods ---

    private void checkMeetingAccess(OneOnOneMeeting meeting) {
        Employee currentUser = authService.getCurrentUser();

        // Manager can see all, Employee can only see if PUBLISHED
        if (currentUser.getId().equals(meeting.getManager().getId())) {
            return;
        }
        if (currentUser.getId().equals(meeting.getEmployee().getId())) {
            if (meeting.getStatus() == ace.org.epms_backend.enums.ContinuousStatus.PUBLISHED) {
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

    private void checkNotPurePrivileged() {
        Employee currentUser = authService.getCurrentUser();
        List<Role> roles = employeeRoleRepository.findRolesByEmployeeId(currentUser.getId());
        boolean hasPrivilegedRole = roles.stream().anyMatch(r -> r.getRoleName() == RoleType.ADMIN || r.getRoleName() == RoleType.HR);
        boolean isManager = roles.stream().anyMatch(r -> r.getRoleName() == RoleType.MANAGER);

        if (hasPrivilegedRole && !isManager) {
             throw new AccessDeniedException("Admins/HR cannot access meeting feeds directly. Use Performance Pulse instead.");
        }
    }

    private void syncActionItems(OneOnOneMeeting meeting, List<String> contents) {
        if (contents == null) return;

        if (meeting.getActionItems() == null) {
            meeting.setActionItems(new java.util.ArrayList<>());
        }

        List<String> validContents = contents.stream()
                .filter(c -> c != null && !c.trim().isEmpty())
                .map(String::trim)
                .collect(java.util.stream.Collectors.toList());

        List<ace.org.epms_backend.model.continuous.MeetingActionItem> currentPendingItems = meeting.getActionItems().stream()
                .filter(item -> item.getStatus() == ace.org.epms_backend.enums.ActionItemStatus.PENDING)
                .collect(java.util.stream.Collectors.toList());

        List<ace.org.epms_backend.model.continuous.MeetingActionItem> toRemove = new java.util.ArrayList<>();
        List<String> tempValidContents = new java.util.ArrayList<>(validContents);

        for (ace.org.epms_backend.model.continuous.MeetingActionItem pendingItem : currentPendingItems) {
            if (!tempValidContents.contains(pendingItem.getContent())) {
                toRemove.add(pendingItem);
            } else {
                tempValidContents.remove(pendingItem.getContent());
            }
        }

        meeting.getActionItems().removeAll(toRemove);
        actionItemRepository.deleteAll(toRemove);

        for (String content : tempValidContents) {
            ace.org.epms_backend.model.continuous.MeetingActionItem newItem =
                    ace.org.epms_backend.model.continuous.MeetingActionItem.builder()
                            .meeting(meeting)
                            .content(content)
                            .status(ace.org.epms_backend.enums.ActionItemStatus.PENDING)
                            .build();
            meeting.getActionItems().add(newItem);
        }
    }

    public double calculateActionItemCompletion(OneOnOneMeeting meeting) {
        if (meeting.getActionItems() == null || meeting.getActionItems().isEmpty()) return 0.0;
        long doneCount = meeting.getActionItems().stream()
                .filter(item -> item.getStatus() == ace.org.epms_backend.enums.ActionItemStatus.DONE)
                .count();
        return (doneCount * 100.0) / meeting.getActionItems().size();
    }
}