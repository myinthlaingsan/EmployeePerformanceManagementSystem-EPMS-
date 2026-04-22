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
        return feedbackMapper.toResponse(feedback);
    }

    @Override
    public ContinuousFeedbackResponse getFeedbackById(Long feedbackId) {
        ContinuousFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new NotFoundException("Feedback not found"));
        return feedbackMapper.toResponse(feedback);
    }

    @Override
    public List<ContinuousFeedbackResponse> getFeedbacksByEmployee(Long employeeId) {
        return feedbackRepository.findByEmployee_Id(employeeId).stream()
                .map(feedbackMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ContinuousFeedbackResponse> getFeedbacksByManager(Long managerId) {
        return feedbackRepository.findByManager_Id(managerId).stream()
                .map(feedbackMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ContinuousFeedbackResponse updateFeedback(Long feedbackId, ContinuousFeedbackRequest request) {
        ContinuousFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new NotFoundException("Feedback not found"));

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
        return feedbackMapper.toResponse(feedback);
    }

    @Override
    @Transactional
    public void deleteFeedback(Long feedbackId) {
        if (!feedbackRepository.existsById(feedbackId)) {
            throw new NotFoundException("Feedback not found");
        }
        feedbackRepository.deleteById(feedbackId);
    }

    @Override
    @Transactional
    public FeedbackReplyResponse replyToFeedback(Long feedbackId, FeedbackReplyRequest request) {
        ContinuousFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new NotFoundException("Feedback not found"));
        
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
                .createdBy(employee.getId())
                .build();
        historyRepository.save(history);

        return replyMapper.toResponse(reply);
    }

    @Override
    public List<FeedbackReplyResponse> getRepliesForFeedback(Long feedbackId) {
        return replyRepository.findByFeedback_FeedbackId(feedbackId).stream()
                .map(replyMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteReply(Long replyId) {
        if (!replyRepository.existsById(replyId)) {
            throw new NotFoundException("Reply not found");
        }
        replyRepository.deleteById(replyId);
    }
}
