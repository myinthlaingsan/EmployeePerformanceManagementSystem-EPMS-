package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.appraisal.FullFormResponse;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.appraisal.AppraisalForm;
import ace.org.epms_backend.model.feedback360.FeedbackRequest;
import ace.org.epms_backend.repository.AppraisalFormRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackRequestRepository;
import ace.org.epms_backend.service.AppraisalFormService;
import ace.org.epms_backend.service.feedback360.FeedbackFormService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FeedbackFormServiceImpl implements FeedbackFormService {

    private final FeedbackRequestRepository requestRepository;
    private final AppraisalFormRepository   formRepository;
    private final AppraisalFormService      formService;

    @Override
    @Transactional(readOnly = true)
    public FullFormResponse getQuestionsForRequest(Long requestId) {
        FeedbackRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Feedback request not found: " + requestId));

        if (request.getForm() == null) {
            throw new NotFoundException(
                "Feedback request " + requestId + " has no form assigned. "
              + "Recreate the cycle's FEEDBACK form, then regenerate requests.");
        }

        Long formId = request.getForm().getFormId();
        AppraisalForm form;
        try {
            form = formRepository.findById(formId)
                    .orElseThrow(() -> new NotFoundException(
                        "Form " + formId + " referenced by request " + requestId
                      + " no longer exists (orphan FK). Recreate the form and regenerate."));
        } catch (NotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException(
                "Cannot resolve form " + formId + " for request " + requestId
              + ": " + e.getMessage(), e);
        }

        FullFormResponse full = formService.getFullForm(formId);

        if (full.getCategories() == null || full.getCategories().isEmpty()) {
            throw new IllegalStateException(
                "Form " + formId + " (\"" + form.getFormName() + "\") has no categories. "
              + "Open the form designer, add a category and questions, then try again.");
        }

        boolean hasQuestions = full.getCategories().stream()
                .anyMatch(c -> c.getQuestions() != null && !c.getQuestions().isEmpty());
        if (!hasQuestions) {
            throw new IllegalStateException(
                "Form " + formId + " (\"" + form.getFormName() + "\") has categories but no questions. "
              + "Add at least one question in the form designer.");
        }

        return full;
    }
}
