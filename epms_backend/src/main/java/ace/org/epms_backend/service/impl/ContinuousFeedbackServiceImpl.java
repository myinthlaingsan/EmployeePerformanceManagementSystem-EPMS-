package ace.org.epms_backend.service.impl;
import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.enums.ContinuousStatus;

import ace.org.epms_backend.dto.continuous.ContinuousFeedbackRequest;
import ace.org.epms_backend.dto.continuous.ContinuousFeedbackResponse;
import ace.org.epms_backend.dto.continuous.FeedbackReplyRequest;
import ace.org.epms_backend.dto.continuous.FeedbackReplyResponse;
import ace.org.epms_backend.enums.AuditAction;
import ace.org.epms_backend.enums.AuditStatus;
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
import ace.org.epms_backend.repository.EmployeeDepartmentRepository;
import ace.org.epms_backend.repository.PerformanceHistoryRepository;
import ace.org.epms_backend.service.ContinuousFeedbackService;
import ace.org.epms_backend.service.AuditService;
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
    private final ace.org.epms_backend.service.ReportingChainService reportingChainService;
    private final EmployeeDepartmentRepository employeeDepartmentRepository;
    private final AuditService auditService;

    @Override
    @Transactional
    public ContinuousFeedbackResponse createFeedback(ContinuousFeedbackRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new NotFoundException("Employee not found"));
        Employee manager = employeeRepository.findById(request.getManagerId())
                .orElseThrow(() -> new NotFoundException("Manager not found"));

        // Validate manager and employee belong to the same department (unless manager is Admin/HR)
        if (!isPrivileged(manager)) {
            ace.org.epms_backend.model.employee.EmployeeDepartment managerDept = employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(manager.getId()).orElse(null);
            ace.org.epms_backend.model.employee.EmployeeDepartment employeeDept = employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(employee.getId()).orElse(null);
            if (managerDept == null || employeeDept == null || 
                managerDept.getCurrentDepartment() == null || employeeDept.getCurrentDepartment() == null ||
                !managerDept.getCurrentDepartment().getId().equals(employeeDept.getCurrentDepartment().getId())) {
                throw new AccessDeniedException("You can only give feedback to employees in your same department.");
            }
            if (isHighestDepartmentManager(employee)) {
                throw new AccessDeniedException("You cannot give feedback to the highest-level manager in this department.");
            }
            if (manager.getLevel() != null && employee.getLevel() != null) {
                if (employee.getLevel().getLevelRank() < manager.getLevel().getLevelRank()) {
                    throw new AccessDeniedException("You cannot submit feedback for higher-level managers.");
                }
            }
        }



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

        // If created directly as PUBLISHED, set publishedAt immediately
        if (feedback.getStatus() == ContinuousStatus.PUBLISHED) {
            feedback.setPublishedAt(java.time.LocalDateTime.now());
        }

        feedback = feedbackRepository.save(feedback);

        // Update PerformanceHistory (only if PUBLISHED)
        if (feedback.getStatus() == ContinuousStatus.PUBLISHED) {
            PerformanceHistory history = PerformanceHistory.builder()
                    .employee(employee)
                    .sourceType(SourceType.FEEDBACK)
                    .sourceId(feedback.getFeedbackId())
                    .title("New Continuous Feedback")
                    .description("Manager " + manager.getStaffName() + " created feedback: " + feedback.getDescription())
                    .feedbackType(feedback.getFeedbackType())
                    .tagName(tag != null ? tag.getTagName() : null)
                    .createdBy(manager.getId())
                    .manager(manager)
                    .performer(manager)
                    .managerPositionName(manager.getPosition() != null ? manager.getPosition().getPositionName() : null)
                    .build();
            historyRepository.save(history);
        }

        // Notify Employee (if PUBLISHED)
        if (feedback.getStatus() == ContinuousStatus.PUBLISHED) {
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

        audit(feedback.getFeedbackId(), AuditAction.INSERT, null, feedbackMapper.toResponse(feedback));

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
    public ace.org.epms_backend.dto.PagedResponse<ContinuousFeedbackResponse> getFeedbacksByEmployee(Long employeeId, ace.org.epms_backend.enums.FeedbackType feedbackType, Long tagId, java.time.LocalDate createdAfter, java.time.LocalDate createdBefore, int page, int size) {
        checkNotPurePrivileged();
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        Employee currentUser = authService.getCurrentUser();

        java.time.Instant after = createdAfter != null ? createdAfter.atStartOfDay(java.time.ZoneOffset.UTC).toInstant() : null;
        java.time.Instant before = createdBefore != null ? createdBefore.plusDays(1).atStartOfDay(java.time.ZoneOffset.UTC).toInstant() : null;

        java.util.Set<Long> subordinateIds = reportingChainService.getAllSubordinateIds(currentUser.getId());
        org.springframework.data.domain.Page<ContinuousFeedback> feedbackPage;
        if (subordinateIds.isEmpty()) {
            feedbackPage = feedbackRepository.findVisibleFeedbacksByEmployee(employeeId, currentUser.getId(), feedbackType, tagId, after, before, pageable);
        } else {
            feedbackPage = feedbackRepository.findVisibleFeedbacksByEmployeeWithChain(employeeId, currentUser.getId(), subordinateIds, feedbackType, tagId, after, before, pageable);
        }

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
    public ace.org.epms_backend.dto.PagedResponse<ContinuousFeedbackResponse> getFeedbacksByManager(Long managerId, ace.org.epms_backend.enums.ContinuousStatus status, ace.org.epms_backend.enums.FeedbackType feedbackType, Long tagId, java.time.LocalDate createdAfter, java.time.LocalDate createdBefore, int page, int size) {
        checkNotPurePrivileged();
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        Employee currentUser = authService.getCurrentUser();

        java.time.Instant after = createdAfter != null ? createdAfter.atStartOfDay(java.time.ZoneOffset.UTC).toInstant() : null;
        java.time.Instant before = createdBefore != null ? createdBefore.plusDays(1).atStartOfDay(java.time.ZoneOffset.UTC).toInstant() : null;

        org.springframework.data.domain.Page<ContinuousFeedback> feedbackPage = feedbackRepository.findVisibleFeedbacksByManager(managerId, currentUser.getId(), status, feedbackType, tagId, after, before, pageable);

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

    private boolean isHighestDepartmentManager(Employee employee) {
        ace.org.epms_backend.model.employee.EmployeeDepartment employeeDept = employeeDepartmentRepository
                .findByEmployeeIdAndIsCurrentTrue(employee.getId())
                .orElse(null);

        if (employeeDept == null || employeeDept.getCurrentDepartment() == null) {
            return false;
        }

        Long departmentId = employeeDept.getCurrentDepartment().getId();

        List<ace.org.epms_backend.model.employee.EmployeeDepartment> deptStaff = employeeDepartmentRepository
                .findByCurrentDepartmentIdAndIsCurrentTrue(departmentId);

        Integer highestRankInDept = deptStaff.stream()
                .map(ace.org.epms_backend.model.employee.EmployeeDepartment::getEmployee)
                .filter(emp -> emp.getIsActive() && emp.getLevel() != null)
                .map(emp -> emp.getLevel().getLevelRank())
                .min(Integer::compare)
                .orElse(Integer.MAX_VALUE);

        return employee.getLevel() != null && 
               employee.getLevel().getLevelRank().equals(highestRankInDept);
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
        ContinuousFeedbackResponse oldState = feedbackMapper.toResponse(feedback);

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

        // Validate manager and employee belong to the same department (unless manager is Admin/HR)
        if (!isPrivileged(feedback.getManager())) {
            ace.org.epms_backend.model.employee.EmployeeDepartment managerDept = employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(feedback.getManager().getId()).orElse(null);
            ace.org.epms_backend.model.employee.EmployeeDepartment employeeDept = employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(feedback.getEmployee().getId()).orElse(null);
            if (managerDept == null || employeeDept == null || 
                managerDept.getCurrentDepartment() == null || employeeDept.getCurrentDepartment() == null ||
                !managerDept.getCurrentDepartment().getId().equals(employeeDept.getCurrentDepartment().getId())) {
                throw new AccessDeniedException("You can only give feedback to employees in your same department.");
            }
            if (isHighestDepartmentManager(feedback.getEmployee())) {
                throw new AccessDeniedException("You cannot give feedback to the highest-level manager in this department.");
            }
            if (feedback.getManager().getLevel() != null && feedback.getEmployee().getLevel() != null) {
                if (feedback.getEmployee().getLevel().getLevelRank() < feedback.getManager().getLevel().getLevelRank()) {
                    throw new AccessDeniedException("You cannot submit feedback for higher-level managers.");
                }
            }
        }

        if (request.getTagId() != null && (feedback.getTag() == null || !feedback.getTag().getTagId().equals(request.getTagId()))) {
            FeedbackTag tag = tagRepository.findById(request.getTagId())
                    .orElseThrow(() -> new NotFoundException("Tag not found"));
            feedback.setTag(tag);
        } else if (request.getTagId() == null) {
            feedback.setTag(null);
        }

        ContinuousStatus oldStatus = feedback.getStatus();
        feedbackMapper.updateEntityFromRequest(request, feedback);

        if (oldStatus == ContinuousStatus.DRAFT
                && feedback.getStatus() == ContinuousStatus.PUBLISHED
                && feedback.getPublishedAt() == null) {
            feedback.setPublishedAt(java.time.LocalDateTime.now());
        }

        feedback = feedbackRepository.save(feedback);

        Employee currentUser = authService.getCurrentUser();
        
        // Update PerformanceHistory (only if PUBLISHED)
        if (feedback.getStatus() == ContinuousStatus.PUBLISHED) {
            PerformanceHistory history = PerformanceHistory.builder()
                    .employee(feedback.getEmployee())
                    .sourceType(SourceType.FEEDBACK)
                    .sourceId(feedback.getFeedbackId())
                    .title("Updated Continuous Feedback")
                    .description((currentUser.getId().equals(feedback.getManager().getId()) ? "Manager " : "Employee ") + currentUser.getStaffName() + " updated feedback. New details: " + feedback.getDescription())
                    .feedbackType(feedback.getFeedbackType())
                    .tagName(feedback.getTag() != null ? feedback.getTag().getTagName() : null)
                    .createdBy(currentUser.getId())
                    .manager(feedback.getManager())
                    .performer(currentUser)
                    .build();
            historyRepository.save(history);
        }

        // Notify Employee (if PUBLISHED)
        if (feedback.getStatus() == ContinuousStatus.PUBLISHED) {
            eventPublisher.publishEvent(NotificationEvent.builder()
                    .recipientId(feedback.getEmployee().getId())
                    .senderId(feedback.getManager().getId())
                    .type(NotificationType.COMMENT_ADDED)
                    .title("Continuous Feedback Updated")
                    .message("Manager " + feedback.getManager().getStaffName() + " updated your feedback: " + feedback.getDescription())
                    .referenceType(ReferenceType.FEEDBACK)
                    .referenceId(feedback.getFeedbackId())
                    .actionUrl("/continuous-feedback")
                    .build());
        }

        audit(feedback.getFeedbackId(), AuditAction.UPDATE, oldState, feedbackMapper.toResponse(feedback));

        return feedbackMapper.toResponse(feedback);
    }

    @Override
    @Transactional
    public void deleteFeedback(Long feedbackId) {
        ContinuousFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new NotFoundException("Feedback not found"));
        
        checkFeedbackModificationAccess(feedback);
        ContinuousFeedbackResponse oldState = feedbackMapper.toResponse(feedback);
        
        // Delete all replies first to avoid foreign key constraint violations
        List<FeedbackReply> replies = replyRepository.findByFeedback_FeedbackId(feedbackId);
        if (!replies.isEmpty()) {
            replyRepository.deleteAll(replies);
        }
        
        feedbackRepository.delete(feedback);

        // Only log deletion to history if the feedback was PUBLISHED.
        // Deleting a DRAFT record must not pollute the analytics tables.
        if (feedback.getStatus() == ContinuousStatus.PUBLISHED) {
            Employee currentUser = authService.getCurrentUser();
            PerformanceHistory history = PerformanceHistory.builder()
                    .employee(feedback.getEmployee())
                    .sourceType(SourceType.FEEDBACK)
                    .sourceId(feedbackId)
                    .title("Feedback Deleted")
                    .description((currentUser.getId().equals(feedback.getManager().getId()) ? "Manager " : "Admin ") + currentUser.getStaffName() + " deleted the feedback.")
                    .feedbackType(feedback.getFeedbackType())
                    .tagName(feedback.getTag() != null ? feedback.getTag().getTagName() : null)
                    .createdBy(currentUser.getId())
                    .manager(feedback.getManager())
                    .performer(currentUser)
                    .build();
            historyRepository.save(history);

            eventPublisher.publishEvent(NotificationEvent.builder()
                    .recipientId(feedback.getEmployee().getId())
                    .senderId(currentUser.getId())
                    .type(NotificationType.SYSTEM)
                    .title("Feedback Deleted")
                    .message("Manager " + currentUser.getStaffName() + " deleted a feedback comment.")
                    .referenceType(ReferenceType.FEEDBACK)
                    .referenceId(feedbackId)
                    .actionUrl("/continuous-feedback")
                    .build());
        }

        audit(feedbackId, AuditAction.DELETE, oldState, null);
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

        // Update PerformanceHistory (only if PUBLISHED)
        if (feedback.getStatus() == ContinuousStatus.PUBLISHED) {
            PerformanceHistory history = PerformanceHistory.builder()
                    .employee(feedback.getEmployee())
                    .sourceType(SourceType.FEEDBACK)
                    .sourceId(feedback.getFeedbackId())
                    .title("New Reply to Feedback")
                    .description((currentUser.getId().equals(feedback.getManager().getId()) ? "Manager " : "Employee ") + currentUser.getStaffName() + " replied: " + reply.getReplyText())
                    .feedbackType(feedback.getFeedbackType())
                    .tagName(feedback.getTag() != null ? feedback.getTag().getTagName() : null)
                    .createdBy(currentUser.getId())
                    .manager(feedback.getManager())
                    .performer(currentUser)
                    .build();
            historyRepository.save(history);
        }

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

        List<ace.org.epms_backend.dto.continuous.FeedbackReplyResponse> all = replyRepository
                .findByFeedback_FeedbackId(feedbackId).stream()
                .map(replyMapper::toResponse)
                .collect(Collectors.toList());

        java.util.Map<Long, ace.org.epms_backend.dto.continuous.FeedbackReplyResponse> byId = all.stream()
                .collect(java.util.stream.Collectors.toMap(
                        ace.org.epms_backend.dto.continuous.FeedbackReplyResponse::getReplyId,
                        r -> r));

        List<ace.org.epms_backend.dto.continuous.FeedbackReplyResponse> roots = new java.util.ArrayList<>();
        for (ace.org.epms_backend.dto.continuous.FeedbackReplyResponse r : all) {
            if (r.getParentId() == null || !byId.containsKey(r.getParentId())) {
                roots.add(r);
            } else {
                ace.org.epms_backend.dto.continuous.FeedbackReplyResponse parent = byId.get(r.getParentId());
                if (parent.getChildren() == null) {
                    parent.setChildren(new java.util.ArrayList<>());
                }
                parent.getChildren().add(r);
            }
        }
        return roots;
    }

    private void checkFeedbackAccess(ContinuousFeedback feedback) {
        Employee currentUser = authService.getCurrentUser();

        // Creator-manager: can see all statuses
        if (currentUser.getId().equals(feedback.getManager().getId())) {
            return;
        }
        // Higher manager in chain: can see PUBLISHED feedback from subordinate managers
        if (feedback.getStatus() == ace.org.epms_backend.enums.ContinuousStatus.PUBLISHED
                && reportingChainService.isInReportingChain(currentUser, feedback.getEmployee())) {
            return;
        }
        // Employee subject: can see own PUBLISHED feedback
        if (currentUser.getId().equals(feedback.getEmployee().getId())) {
            if (feedback.getStatus() == ace.org.epms_backend.enums.ContinuousStatus.PUBLISHED) {
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
    public ace.org.epms_backend.dto.PagedResponse<ContinuousFeedbackResponse> getAllFeedbacks(ace.org.epms_backend.enums.ContinuousStatus status, ace.org.epms_backend.enums.FeedbackType feedbackType, Long tagId, java.time.LocalDate createdAfter, java.time.LocalDate createdBefore, int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        Employee currentUser = authService.getCurrentUser();

        java.time.Instant after = createdAfter != null ? createdAfter.atStartOfDay(java.time.ZoneOffset.UTC).toInstant() : null;
        java.time.Instant before = createdBefore != null ? createdBefore.plusDays(1).atStartOfDay(java.time.ZoneOffset.UTC).toInstant() : null;

        org.springframework.data.domain.Page<ContinuousFeedback> feedbackPage = feedbackRepository.findAllVisibleFeedbacks(currentUser.getId(), status, feedbackType, tagId, after, before, pageable);

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

        // Update PerformanceHistory (only if PUBLISHED)
        if (reply.getFeedback().getStatus() == ContinuousStatus.PUBLISHED) {
            PerformanceHistory history = PerformanceHistory.builder()
                    .employee(reply.getFeedback().getEmployee())
                    .sourceType(SourceType.FEEDBACK)
                    .sourceId(reply.getFeedback().getFeedbackId())
                    .title("Feedback Reply Updated")
                    .description(currentUser.getStaffName() + " updated their reply: " + request.getReplyText())
                    .feedbackType(reply.getFeedback().getFeedbackType())
                    .tagName(reply.getFeedback().getTag() != null ? reply.getFeedback().getTag().getTagName() : null)
                    .createdBy(currentUser.getId())
                    .manager(reply.getFeedback().getManager())
                    .performer(currentUser)
                    .build();
            historyRepository.save(history);
        }

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

        // Update PerformanceHistory (only if PUBLISHED)
        if (reply.getFeedback().getStatus() == ContinuousStatus.PUBLISHED) {
            PerformanceHistory history = PerformanceHistory.builder()
                    .employee(reply.getFeedback().getEmployee())
                    .sourceType(SourceType.FEEDBACK)
                    .sourceId(reply.getFeedback().getFeedbackId())
                    .title("Feedback Reply Deleted")
                    .description(currentUser.getStaffName() + " deleted their reply.")
                    .feedbackType(reply.getFeedback().getFeedbackType())
                    .tagName(reply.getFeedback().getTag() != null ? reply.getFeedback().getTag().getTagName() : null)
                    .createdBy(currentUser.getId())
                    .manager(reply.getFeedback().getManager())
                    .performer(currentUser)
                    .build();
            historyRepository.save(history);
        }
    }

    @Override
    @Transactional
    public ContinuousFeedbackResponse publishFeedback(Long feedbackId) {
        ContinuousFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new NotFoundException("Feedback not found"));
        
        checkFeedbackModificationAccess(feedback);
        ContinuousFeedbackResponse oldState = feedbackMapper.toResponse(feedback);
        
        if (feedback.getStatus() == ContinuousStatus.PUBLISHED) {
            throw new IllegalStateException("Feedback is already published.");
        }
        
        feedback.setStatus(ContinuousStatus.PUBLISHED);
        feedback.setPublishedAt(java.time.LocalDateTime.now());
        feedback = feedbackRepository.save(feedback);
        
        eventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(feedback.getEmployee().getId())
                .senderId(feedback.getManager().getId())
                .type(NotificationType.COMMENT_ADDED)
                .title("Feedback Published")
                .message("Manager " + feedback.getManager().getStaffName() + " published a feedback comment: " + feedback.getDescription())
                .referenceType(ReferenceType.FEEDBACK)
                .referenceId(feedback.getFeedbackId())
                .actionUrl("/continuous-feedback")
                .build());

        // Only log history if PUBLISHED
        if (feedback.getStatus() == ContinuousStatus.PUBLISHED) {
            PerformanceHistory history = PerformanceHistory.builder()
                    .employee(feedback.getEmployee())
                    .sourceType(SourceType.FEEDBACK)
                    .sourceId(feedback.getFeedbackId())
                    .title("Continuous Feedback Published")
                    .description("Manager " + feedback.getManager().getStaffName() + " published the draft feedback.")
                    .feedbackType(feedback.getFeedbackType())
                    .tagName(feedback.getTag() != null ? feedback.getTag().getTagName() : null)
                    .createdBy(feedback.getManager().getId())
                    .manager(feedback.getManager())
                    .performer(feedback.getManager())
                    .build();
            historyRepository.save(history);
        }

        audit(feedback.getFeedbackId(), AuditAction.UPDATE, oldState, feedbackMapper.toResponse(feedback));
        
        return feedbackMapper.toResponse(feedback);
    }

    @Override
    public ace.org.epms_backend.dto.continuous.ContinuousStatsResponse getFeedbackStats(Long employeeId) {
        long published = feedbackRepository.countByEmployee_IdAndStatus(employeeId, ace.org.epms_backend.enums.ContinuousStatus.PUBLISHED);
        long draft = feedbackRepository.countByEmployee_IdAndStatus(employeeId, ace.org.epms_backend.enums.ContinuousStatus.DRAFT);
        
        return ace.org.epms_backend.dto.continuous.ContinuousStatsResponse.builder()
                .totalPublished(published)
                .totalDraft(draft)
                .build();
    }

    @Override
    public ace.org.epms_backend.dto.continuous.ContinuousStatsResponse getFeedbackStatsForManager(Long managerId) {
        long published = feedbackRepository.countByManager_IdAndStatus(managerId, ace.org.epms_backend.enums.ContinuousStatus.PUBLISHED);
        long draft = feedbackRepository.countByManager_IdAndStatus(managerId, ace.org.epms_backend.enums.ContinuousStatus.DRAFT);
        
        return ace.org.epms_backend.dto.continuous.ContinuousStatsResponse.builder()
                .totalPublished(published)
                .totalDraft(draft)
                .build();
    }

    private void audit(Long recordId, AuditAction action, Object oldState, Object newState) {
        auditService.log(AuditRequest.builder()
                .tableName("continuous_feedback")
                .recordId(recordId)
                .action(action)
                .oldState(oldState)
                .newState(newState)
                .status(AuditStatus.SUCCESS)
                .build());
    }
}
