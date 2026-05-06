package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.appraisal.FullFormResponse;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.feedback360.FeedbackRequest;
import ace.org.epms_backend.repository.feedback360.FeedbackRequestRepository;
import ace.org.epms_backend.service.AppraisalFormService;
import ace.org.epms_backend.service.feedback360.FeedbackFormService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FeedbackFormServiceImpl implements FeedbackFormService {

    private final FeedbackRequestRepository requestRepository;
    private final AppraisalFormService formService;

    @Override
    public FullFormResponse getQuestionsForRequest(Long requestId) {
        FeedbackRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Feedback request not found: " + requestId));

        if (request.getForm() == null) {
            throw new NotFoundException("No form assigned to this feedback request.");
        }

        return formService.getFullForm(request.getForm().getFormId());
    }
}
