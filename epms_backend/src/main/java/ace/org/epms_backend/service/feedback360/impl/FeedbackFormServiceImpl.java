package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.appraisal.FullFormResponse;
import ace.org.epms_backend.dto.feedback360.FeedbackFormCreationRequest;
import ace.org.epms_backend.enums.FormType;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.appraisal.AppraisalForm;
import ace.org.epms_backend.model.appraisal.FormCategory;
import ace.org.epms_backend.model.appraisal.Question;
import ace.org.epms_backend.model.feedback360.FeedbackRequest;
import ace.org.epms_backend.repository.AppraisalCycleRepository;
import ace.org.epms_backend.repository.AppraisalFormRepository;
import ace.org.epms_backend.repository.FormCategoryRepository;
import ace.org.epms_backend.repository.QuestionRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackRequestRepository;
import ace.org.epms_backend.service.AppraisalFormService;
import ace.org.epms_backend.service.feedback360.FeedbackFormService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FeedbackFormServiceImpl implements FeedbackFormService {

    private final FeedbackRequestRepository requestRepository;
    private final AppraisalFormService formService;
    private final AppraisalCycleRepository cycleRepository;
    private final AppraisalFormRepository formRepository;
    private final FormCategoryRepository categoryRepository;
    private final QuestionRepository questionRepository;

    @Override
    public FullFormResponse getQuestionsForRequest(Long requestId) {
        FeedbackRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Feedback request not found: " + requestId));

        if (request.getAssignedForm() != null) {
            return formService.getFullForm(request.getAssignedForm().getFormId());
        }
        
        AppraisalCycle cycle = request.getCycle();
        AppraisalForm feedbackForm = cycle.getForms().stream()
                .filter(f -> f.getFormType() == FormType.FEEDBACK)
                .findFirst()
                .orElseThrow(() -> new NotFoundException("No feedback form found for this cycle"));

        return formService.getFullForm(feedbackForm.getFormId());
    }

    @Override
    public FullFormResponse getFeedbackFormForCycle(Long cycleId) {
        AppraisalCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new NotFoundException("Cycle not found"));
        
        AppraisalForm feedbackForm = cycle.getForms().stream()
                .filter(f -> f.getFormType() == FormType.FEEDBACK)
                .findFirst()
                .orElseThrow(() -> new NotFoundException("No feedback form found for this cycle"));

        return formService.getFullForm(feedbackForm.getFormId());
    }

    @Override
    @Transactional
    public Long saveFeedbackFormForCycle(Long cycleId, FeedbackFormCreationRequest request) {
        AppraisalCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new NotFoundException("Cycle not found"));

        // Locking validation
        if (cycle.getEndDate() != null && LocalDate.now().isAfter(cycle.getEndDate())) {
            throw new IllegalStateException("Form is locked. The appraisal cycle end date has passed.");
        }

        AppraisalForm feedbackForm = cycle.getForms().stream()
                .filter(f -> f.getFormType() == FormType.FEEDBACK)
                .findFirst()
                .orElse(null);

        if (feedbackForm == null) {
            feedbackForm = new AppraisalForm();
            feedbackForm.setCycle(cycle);
            feedbackForm.setFormType(FormType.FEEDBACK);
            // Default createdBy for now
            feedbackForm.setCreatedBy(1L);
        } else {
            // Delete existing categories and questions to recreate them
            List<FormCategory> existingCategories = categoryRepository.findByForm_FormId(feedbackForm.getFormId());
            categoryRepository.deleteAll(existingCategories);
        }

        feedbackForm.setFormName(request.getFormName() != null ? request.getFormName() : "360 Feedback Form");
        final AppraisalForm savedForm = formRepository.save(feedbackForm);

        if (request.getCategories() != null) {
            for (FeedbackFormCreationRequest.CategoryPayload catPayload : request.getCategories()) {
                FormCategory cat = new FormCategory();
                cat.setForm(savedForm);
                cat.setCategoryName(catPayload.getCategoryName());
                cat.setIsActive(true);
                final FormCategory savedCat = categoryRepository.save(cat);

                if (catPayload.getQuestions() != null) {
                    for (FeedbackFormCreationRequest.QuestionPayload qPayload : catPayload.getQuestions()) {
                        Question q = new Question();
                        q.setCategory(savedCat);
                        q.setQuestionText(qPayload.getQuestionText());
                        q.setQuestionType(qPayload.getQuestionType());
                        q.setIsRequired(qPayload.getIsRequired() != null ? qPayload.getIsRequired() : true);
                        q.setRequiresComment(qPayload.getRequiresComment() != null ? qPayload.getRequiresComment() : false);
                        q.setIsActive(true);
                        questionRepository.save(q);
                    }
                }
            }
        }

        return savedForm.getFormId();
    }
}
