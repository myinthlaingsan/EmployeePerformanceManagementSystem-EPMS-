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
                .isPrivate(feedback.getIsPrivate())
                .createdBy(manager.getId())
                .build();
        historyRepository.save(history);

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
    public List<ContinuousFeedbackResponse> getFeedbacksByEmployee(Long employeeId) {
        Employee currentUser = authService.getCurrentUser();

        return feedbackRepository.findByEmployee_Id(employeeId).stream()
                .filter(f -> currentUser.getId().equals(f.getEmployee().getId()) ||
                             currentUser.getId().equals(f.getManager().getId()))
                .map(feedbackMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ContinuousFeedbackResponse> getFeedbacksByManager(Long managerId) {
        Employee currentUser = authService.getCurrentUser();

        return feedbackRepository.findByManager_Id(managerId).stream()
                .filter(f -> currentUser.getId().equals(f.getEmployee().getId()) ||
                             currentUser.getId().equals(f.getManager().getId()))
                .map(feedbackMapper::toResponse)
                .collect(Collectors.toList());
    }



    @Override
    @Transactional
    public ContinuousFeedbackResponse updateFeedback(Long feedbackId, ContinuousFeedbackRequest request) {
        ContinuousFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new NotFoundException("Feedback not found"));
        
        checkFeedbackAccess(feedback);

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

        // Update PerformanceHistory
        PerformanceHistory history = PerformanceHistory.builder()
                .employee(feedback.getEmployee())
                .sourceType(SourceType.FEEDBACK)
                .sourceId(feedback.getFeedbackId())
                .title("Updated Continuous Feedback")
                .description("Feedback was updated. New description: " + feedback.getDescription())
                .isPrivate(feedback.getIsPrivate())
                .createdBy(feedback.getManager().getId())
                .build();
        historyRepository.save(history);

        return feedbackMapper.toResponse(feedback);
    }

    @Override
    @Transactional
    public void deleteFeedback(Long feedbackId) {
        ContinuousFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new NotFoundException("Feedback not found"));
        
        checkFeedbackAccess(feedback);
        feedbackRepository.delete(feedback);
    }

    @Override
    @Transactional
    public FeedbackReplyResponse replyToFeedback(Long feedbackId, FeedbackReplyRequest request) {
        ContinuousFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new NotFoundException("Feedback not found"));
        
        checkFeedbackAccess(feedback);
        
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        FeedbackReply reply = replyMapper.toEntity(request);
        reply.setFeedback(feedback);
        reply.setEmployee(employee);
        
        reply = replyRepository.save(reply);

        // Update PerformanceHistory
        PerformanceHistory history = PerformanceHistory.builder()
                .employee(feedback.getEmployee())
                .sourceType(SourceType.FEEDBACK)
                .sourceId(feedback.getFeedbackId())
                .title("New Reply to Feedback")
                .description("Employee " + employee.getStaffName() + " replied: " + reply.getReplyText())
                .isPrivate(feedback.getIsPrivate())
                .createdBy(employee.getId())
                .build();
        historyRepository.save(history);

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

        // Strictly only employee or manager of the feedback
        if (currentUser.getId().equals(feedback.getEmployee().getId()) ||
                currentUser.getId().equals(feedback.getManager().getId())) {
            return;
        }

        throw new NotFoundException("Feedback not found");
    }

    @Override
    @Transactional
    public void deleteReply(Long replyId) {
        FeedbackReply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new NotFoundException("Reply not found"));
        
        checkFeedbackAccess(reply.getFeedback());
        
        replyRepository.delete(reply);
    }
}
