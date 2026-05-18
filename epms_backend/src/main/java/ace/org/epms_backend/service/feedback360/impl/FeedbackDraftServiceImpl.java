package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.feedback360.FeedbackDraftItemDTO;
import ace.org.epms_backend.dto.feedback360.FeedbackDraftRequest;
import ace.org.epms_backend.dto.feedback360.FeedbackDraftResponse;
import ace.org.epms_backend.enums.FeedbackStatus;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.feedback360.FeedbackDraft;
import ace.org.epms_backend.model.feedback360.FeedbackRequest;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackDraftRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackRequestRepository;
import ace.org.epms_backend.service.feedback360.FeedbackDraftService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FeedbackDraftServiceImpl implements FeedbackDraftService {

    private final FeedbackDraftRepository draftRepository;
    private final FeedbackRequestRepository requestRepository;
    private final EmployeeRepository employeeRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void saveDraft(Long evaluatorId, FeedbackDraftRequest req) {
        FeedbackRequest feedbackRequest = requestRepository.findById(req.getRequestId())
                .orElseThrow(() -> new NotFoundException("Feedback request not found: " + req.getRequestId()));

        if (!feedbackRequest.getEvaluator().getId().equals(evaluatorId)) {
            throw new SecurityException("Not authorized to draft this request.");
        }
        if (feedbackRequest.getStatus() == FeedbackStatus.COMPLETED) {
            throw new IllegalStateException("Feedback already submitted.");
        }

        Employee evaluator = employeeRepository.findById(evaluatorId)
                .orElseThrow(() -> new NotFoundException("Employee not found: " + evaluatorId));

        FeedbackDraft draft = draftRepository
                .findByRequestIdAndEvaluatorId(req.getRequestId(), evaluatorId)
                .orElse(FeedbackDraft.builder()
                        .request(feedbackRequest)
                        .evaluator(evaluator)
                        .build());

        draft.setOverallComment(req.getOverallComment());
        draft.setResponsesJson(toJson(req.getResponses()));

        // Advance status to IN_PROGRESS if still PENDING
        if (feedbackRequest.getStatus() == FeedbackStatus.PENDING) {
            feedbackRequest.setStatus(FeedbackStatus.IN_PROGRESS);
            requestRepository.save(feedbackRequest);
        }

        draftRepository.save(draft);
    }

    @Override
    public FeedbackDraftResponse getDraft(Long evaluatorId, Long requestId) {
        return draftRepository.findByRequestIdAndEvaluatorId(requestId, evaluatorId)
                .map(d -> FeedbackDraftResponse.builder()
                        .requestId(requestId)
                        .overallComment(d.getOverallComment())
                        .responses(fromJson(d.getResponsesJson()))
                        .savedAt(d.getUpdatedAt())
                        .build())
                .orElse(null);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String toJson(List<FeedbackDraftItemDTO> items) {
        if (items == null) return "[]";
        try {
            return objectMapper.writeValueAsString(items);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private List<FeedbackDraftItemDTO> fromJson(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<FeedbackDraftItemDTO>>() {});
        } catch (JsonProcessingException e) {
            return Collections.emptyList();
        }
    }
}
