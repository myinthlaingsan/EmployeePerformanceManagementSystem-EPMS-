package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.continuous.ContinuousFeedbackRequest;
import ace.org.epms_backend.dto.continuous.ContinuousFeedbackResponse;
import ace.org.epms_backend.dto.continuous.FeedbackReplyRequest;
import ace.org.epms_backend.dto.continuous.FeedbackReplyResponse;
import ace.org.epms_backend.enums.SourceType;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.continuous.ContinuousFeedbackMapper;
import ace.org.epms_backend.mapper.continuous.FeedbackReplyMapper;
import ace.org.epms_backend.model.continuous.ContinuousFeedback;
import ace.org.epms_backend.model.continuous.FeedbackReply;
import ace.org.epms_backend.model.continuous.FeedbackTag;
import ace.org.epms_backend.model.continuous.PerformanceHistory;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.repository.ContinuousFeedbackRepository;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.FeedbackReplyRepository;
import ace.org.epms_backend.repository.FeedbackTagRepository;
import ace.org.epms_backend.repository.PerformanceHistoryRepository;
import ace.org.epms_backend.service.ContinuousFeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ace.org.epms_backend.service.AuthService;
import ace.org.epms_backend.repository.EmployeeRoleRepository;
import ace.org.epms_backend.enums.RoleType;
import ace.org.epms_backend.exception.AccessDeniedException;
import ace.org.epms_backend.model.employee.Role;
import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContinuousFeedbackServiceImpl implements ContinuousFeedbackService {

    private final ContinuousFeedbackRepository feedbackRepository;
    private final FeedbackReplyRepository replyRepository;
    private final ContinuousFeedbackMapper feedbackMapper;
    private final FeedbackReplyMapper replyMapper;
    private final EmployeeRepository employeeRepository;
    private final FeedbackTagRepository tagRepository;
    private final PerformanceHistoryRepository historyRepository;
    private final AuthService authService;
    private final EmployeeRoleRepository employeeRoleRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public ContinuousFeedbackResponse createFeedback(ContinuousFeedbackRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new NotFoundException("Employee not found"));
        Employee manager = employeeRepository.findById(request.getManagerId())
                .orElseThrow(() -> new NotFoundException("Manager not found"));
        
        FeedbackTag tag = null;
        if (request.getTagId() != null) {
            tag = tagRepository.findById(request.getTagId())
                    .orElseThrow(() -> new NotFoundException("Tag not found"));
        }

        ContinuousFeedback feedback = feedbackMapper.toEntity(request);
        feedback.setEmployee(employee);
        feedback.setManager(manager);
        feedback.setTag(tag);
        // Assuming the manager is the one creating it for now
        feedback.setCreatedBy(manager.getId());

        feedback = feedbackRepository.save(feedback);

        // Update PerformanceHistory
        PerformanceHistory history = PerformanceHistory.builder()
                .employee(employee)
                .sourceType(SourceType.FEEDBACK)
                .sourceId(feedback.getFeedbackId())
                .title("New Continuous Feedback")
                .description("Manager " + manager.getStaffName() + " created feedback: " + feedback.getDescription())
                .feedbackType(feedback.getFeedbackType())
                .tagName(tag != null ? tag.getTagName() : null)
                .isPrivate(feedback.getIsPrivate())
                .createdBy(manager.getId())
                .manager(manager)
                .performer(manager)
                .build();
        historyRepository.save(history);

        // Notify Employee (if not private)
        if (!Boolean.TRUE.equals(feedback.getIsPrivate())) {
            eventPublisher.publishEvent(NotificationEvent.builder()
                    .recipientId(employee.getId())
                    .senderId(manager.getId())
                    .type(NotificationType.COMMENT_ADDED)
                    .title("New Feedback Comment")
                    .message("Manager " + manager.getStaffName() + " added a feedback comment: " + feedback.getDescription())
                    .referenceType(ReferenceType.FEEDBACK) // Continuous feedback doesn't have a specific entity yet or use NONE
                    .referenceId(feedback.getFeedbackId())
                    .actionUrl("/continuous-feedback")
                    .build());
        }

        return feedbackMapper.toResponse(feedback);
    }

    @Override
    public ContinuousFeedbackResponse getFeedbackById(Long feedbackId) {
        ContinuousFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new NotFoundException("Feedback not found"));
        
        checkFeedbackAccess(feedback);
        
        return feedbackMapper.toResponse(feedback);
    }

    @Override
    public ace.org.epms_backend.dto.PagedResponse<ContinuousFeedbackResponse> getFeedbacksByEmployee(Long employeeId, int page, int size) {
        checkNotPurePrivileged();
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        Employee currentUser = authService.getCurrentUser();

        org.springframework.data.domain.Page<ContinuousFeedback> feedbackPage = feedbackRepository.findVisibleFeedbacksByEmployee(employeeId, currentUser.getId(), pageable);

        List<ContinuousFeedbackResponse> content = feedbackPage.getContent().stream()
                .map(feedbackMapper::toResponse)
                .collect(Collectors.toList());

        return new ace.org.epms_backend.dto.PagedResponse<>(
                content,
                feedbackPage.getNumber(),
                feedbackPage.getSize(),
                feedbackPage.getTotalElements(),
                feedbackPage.getTotalPages(),
                feedbackPage.isLast()
        );
    }

    @Override
    public ace.org.epms_backend.dto.PagedResponse<ContinuousFeedbackResponse> getFeedbacksByManager(Long managerId, int page, int size) {
        checkNotPurePrivileged();
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        Employee currentUser = authService.getCurrentUser();

        org.springframework.data.domain.Page<ContinuousFeedback> feedbackPage = feedbackRepository.findVisibleFeedbacksByManager(managerId, currentUser.getId(), pageable);

        List<ContinuousFeedbackResponse> content = feedbackPage.getContent().stream()
                .map(feedbackMapper::toResponse)
                .collect(Collectors.toList());

        return new ace.org.epms_backend.dto.PagedResponse<>(
                content,
                feedbackPage.getNumber(),
                feedbackPage.getSize(),
                feedbackPage.getTotalElements(),
                feedbackPage.getTotalPages(),
                feedbackPage.isLast()
        );
    }

    private boolean isPrivileged(Employee employee) {
        List<Role> roles = employeeRoleRepository.findRolesByEmployeeId(employee.getId());
        return roles.stream()
                .anyMatch(r -> r.getRoleName() == RoleType.ADMIN || r.getRoleName() == RoleType.HR);
    }

    private void checkNotPurePrivileged() {
        Employee currentUser = authService.getCurrentUser();
        List<Role> roles = employeeRoleRepository.findRolesByEmployeeId(currentUser.getId());
        boolean hasPrivilegedRole = roles.stream().anyMatch(r -> r.getRoleName() == RoleType.ADMIN || r.getRoleName() == RoleType.HR);
        boolean isManager = roles.stream().anyMatch(r -> r.getRoleName() == RoleType.MANAGER);
        
        if (hasPrivilegedRole && !isManager) {
             throw new ace.org.epms_backend.exception.AccessDeniedException("Admins/HR cannot access feedback feeds directly. Use Performance Pulse instead.");
        }
    }

    @Override
    @Transactional
    public ContinuousFeedbackResponse updateFeedback(Long feedbackId, ContinuousFeedbackRequest request) {
        ContinuousFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new NotFoundException("Feedback not found"));
        
        checkFeedbackModificationAccess(feedback);

        if (!feedback.getEmployee().getId().equals(request.getEmployeeId())) {
            Employee employee = employeeRepository.findById(request.getEmployeeId())
                    .orElseThrow(() -> new NotFoundException("Employee not found"));
            feedback.setEmployee(employee);
        }

        if (!feedback.getManager().getId().equals(request.getManagerId())) {
            Employee manager = employeeRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new NotFoundException("Manager not found"));
            feedback.setManager(manager);
        }

        if (request.getTagId() != null && (feedback.getTag() == null || !feedback.getTag().getTagId().equals(request.getTagId()))) {
            FeedbackTag tag = tagRepository.findById(request.getTagId())
                    .orElseThrow(() -> new NotFoundException("Tag not found"));
            feedback.setTag(tag);
        } else if (request.getTagId() == null) {
            feedback.setTag(null);
        }

        feedbackMapper.updateEntityFromRequest(request, feedback);
        feedback = feedbackRepository.save(feedback);

        Employee currentUser = authService.getCurrentUser();
        // Update PerformanceHistory
        PerformanceHistory history = PerformanceHistory.builder()
                .employee(feedback.getEmployee())
                .sourceType(SourceType.FEEDBACK)
                .sourceId(feedback.getFeedbackId())
                .title("Updated Continuous Feedback")
                .description((currentUser.getId().equals(feedback.getManager().getId()) ? "Manager " : "Employee ") + currentUser.getStaffName() + " updated feedback. New details: " + feedback.getDescription())
                .feedbackType(feedback.getFeedbackType())
                .tagName(feedback.getTag() != null ? feedback.getTag().getTagName() : null)
                .isPrivate(feedback.getIsPrivate())
                .createdBy(currentUser.getId())
                .manager(feedback.getManager())
                .performer(currentUser)
                .build();
        historyRepository.save(history);

        return feedbackMapper.toResponse(feedback);
    }

    @Override
    @Transactional
    public void deleteFeedback(Long feedbackId) {
        ContinuousFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new NotFoundException("Feedback not found"));
        
        checkFeedbackModificationAccess(feedback);
        
        // Delete all replies first to avoid foreign key constraint violations
        List<FeedbackReply> replies = replyRepository.findByFeedback_FeedbackId(feedbackId);
        if (!replies.isEmpty()) {
            replyRepository.deleteAll(replies);
        }
        
        feedbackRepository.delete(feedback);

        Employee currentUser = authService.getCurrentUser();
        PerformanceHistory history = PerformanceHistory.builder()
                .employee(feedback.getEmployee())
                .sourceType(SourceType.FEEDBACK)
                .sourceId(feedbackId)
                .title("Feedback Deleted")
                .description((currentUser.getId().equals(feedback.getManager().getId()) ? "Manager " : "Admin ") + currentUser.getStaffName() + " deleted the feedback.")
                .feedbackType(feedback.getFeedbackType())
                .tagName(feedback.getTag() != null ? feedback.getTag().getTagName() : null)
                .isPrivate(feedback.getIsPrivate())
                .createdBy(currentUser.getId())
                .manager(feedback.getManager())
                .performer(currentUser)
                .build();
        historyRepository.save(history);
    }

    @Override
    @Transactional
    public FeedbackReplyResponse replyToFeedback(Long feedbackId, FeedbackReplyRequest request) {
        ContinuousFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new NotFoundException("Feedback not found"));
        
        checkFeedbackAccess(feedback);
        
        Employee currentUser = authService.getCurrentUser();
        
        // Ensure the person replying is the one who is logged in
        if (!currentUser.getId().equals(request.getEmployeeId())) {
            throw new AccessDeniedException("You can only reply as yourself.");
        }

        FeedbackReply reply = replyMapper.toEntity(request);
        reply.setFeedback(feedback);
        reply.setEmployee(currentUser);
        
        reply = replyRepository.save(reply);

        // Update PerformanceHistory
        PerformanceHistory history = PerformanceHistory.builder()
                .employee(feedback.getEmployee())
                .sourceType(SourceType.FEEDBACK)
                .sourceId(feedback.getFeedbackId())
                .title("New Reply to Feedback")
                .description((currentUser.getId().equals(feedback.getManager().getId()) ? "Manager " : "Employee ") + currentUser.getStaffName() + " replied: " + reply.getReplyText())
                .feedbackType(feedback.getFeedbackType())
                .tagName(feedback.getTag() != null ? feedback.getTag().getTagName() : null)
                .isPrivate(feedback.getIsPrivate())
                .createdBy(currentUser.getId())
                .manager(feedback.getManager())
                .performer(currentUser)
                .build();
        historyRepository.save(history);

        // Notify the other party
        Long recipientId = currentUser.getId().equals(feedback.getManager().getId()) 
                           ? feedback.getEmployee().getId() 
                           : feedback.getManager().getId();

        eventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(recipientId)
                .senderId(currentUser.getId())
                .type(NotificationType.COMMENT_REPLY)
                .title("New Reply to Feedback")
                .message(currentUser.getStaffName() + " replied: " + reply.getReplyText())
                .referenceType(ReferenceType.FEEDBACK)
                .referenceId(feedback.getFeedbackId())
                .actionUrl("/continuous-feedback")
                .build());

        return replyMapper.toResponse(reply);
    }

    @Override
    public List<FeedbackReplyResponse> getRepliesForFeedback(Long feedbackId) {
        ContinuousFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new NotFoundException("Feedback not found"));
        
        checkFeedbackAccess(feedback);

        return replyRepository.findByFeedback_FeedbackId(feedbackId).stream()
                .map(replyMapper::toResponse)
                .collect(Collectors.toList());
    }

    private void checkFeedbackAccess(ContinuousFeedback feedback) {
        Employee currentUser = authService.getCurrentUser();

        // If private, only Manager can see
        if (Boolean.TRUE.equals(feedback.getIsPrivate())) {
            if (currentUser.getId().equals(feedback.getManager().getId())) {
                return;
            }
        } else {
            // If not private, both Manager and Employee can see
            if (currentUser.getId().equals(feedback.getEmployee().getId()) ||
                    currentUser.getId().equals(feedback.getManager().getId())) {
                return;
            }
        }

        throw new NotFoundException("Feedback not found");
    }

    private void checkFeedbackModificationAccess(ContinuousFeedback feedback) {
        Employee currentUser = authService.getCurrentUser();

        if (!currentUser.getId().equals(feedback.getManager().getId())) {
            throw new AccessDeniedException("You do not have permission to modify this feedback.");
        }
    }

    @Override
    public ace.org.epms_backend.dto.PagedResponse<ContinuousFeedbackResponse> getAllFeedbacks(int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        Employee currentUser = authService.getCurrentUser();

        org.springframework.data.domain.Page<ContinuousFeedback> feedbackPage = feedbackRepository.findAllVisibleFeedbacks(currentUser.getId(), pageable);

        List<ContinuousFeedbackResponse> content = feedbackPage.getContent().stream()
                .map(feedbackMapper::toResponse)
                .collect(Collectors.toList());

        return new ace.org.epms_backend.dto.PagedResponse<>(
                content,
                feedbackPage.getNumber(),
                feedbackPage.getSize(),
                feedbackPage.getTotalElements(),
                feedbackPage.getTotalPages(),
                feedbackPage.isLast()
        );
    }

    @Override
    @Transactional
    public FeedbackReplyResponse updateReply(Long replyId, FeedbackReplyRequest request) {
        FeedbackReply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new NotFoundException("Reply not found"));
                
        Employee currentUser = authService.getCurrentUser();
        if (!currentUser.getId().equals(reply.getEmployee().getId()) && !isPrivileged(currentUser)) {
            throw new AccessDeniedException("You can only edit your own replies.");
        }

        reply.setReplyText(request.getReplyText());
        FeedbackReply updatedReply = replyRepository.save(reply);

        PerformanceHistory history = PerformanceHistory.builder()
                .employee(reply.getFeedback().getEmployee())
                .sourceType(SourceType.FEEDBACK)
                .sourceId(reply.getFeedback().getFeedbackId())
                .title("Feedback Reply Updated")
                .description(currentUser.getStaffName() + " updated their reply: " + request.getReplyText())
                .feedbackType(reply.getFeedback().getFeedbackType())
                .tagName(reply.getFeedback().getTag() != null ? reply.getFeedback().getTag().getTagName() : null)
                .isPrivate(reply.getFeedback().getIsPrivate())
                .createdBy(currentUser.getId())
                .manager(reply.getFeedback().getManager())
                .performer(currentUser)
                .build();
        historyRepository.save(history);

        return replyMapper.toResponse(updatedReply);
    }

    @Override
    @Transactional
    public void deleteReply(Long replyId) {
        FeedbackReply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new NotFoundException("Reply not found"));
        
        Employee currentUser = authService.getCurrentUser();
        if (!currentUser.getId().equals(reply.getEmployee().getId()) && !isPrivileged(currentUser)) {
            throw new AccessDeniedException("You can only delete your own replies.");
        }
        
        replyRepository.delete(reply);

        PerformanceHistory history = PerformanceHistory.builder()
                .employee(reply.getFeedback().getEmployee())
                .sourceType(SourceType.FEEDBACK)
                .sourceId(reply.getFeedback().getFeedbackId())
                .title("Feedback Reply Deleted")
                .description(currentUser.getStaffName() + " deleted their reply.")
                .feedbackType(reply.getFeedback().getFeedbackType())
                .tagName(reply.getFeedback().getTag() != null ? reply.getFeedback().getTag().getTagName() : null)
                .isPrivate(reply.getFeedback().getIsPrivate())
                .createdBy(currentUser.getId())
                .manager(reply.getFeedback().getManager())
                .performer(currentUser)
                .build();
        historyRepository.save(history);
    }
}
