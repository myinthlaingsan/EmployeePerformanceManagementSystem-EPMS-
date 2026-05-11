package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.appraisal.*;
import ace.org.epms_backend.enums.QuestionType;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.appraisal.*;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.repository.appraisal.AppraisalFormSetRepository;
import ace.org.epms_backend.service.AppraisalFormService;
import ace.org.epms_backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppraisalFormServiceImpl implements AppraisalFormService {

    private final AppraisalFormRepository formRepository;
    private final FormCategoryRepository categoryRepository;
    private final QuestionRepository questionRepository;
    private final AppraisalCycleRepository cycleRepository;
    private final AppraisalRepository appraisalRepository;
    private final AppraisalFormSetRepository formSetRepository;
    private final AuthService authService;

    @Override
    @Transactional
    public Long createForm(AppraisalFormRequest request) {
        AppraisalForm form = new AppraisalForm();
        form.setFormName(request.getFormName());
        form.setFormType(request.getFormType());

        if (request.getCycleId() != null) {
            AppraisalCycle cycle = cycleRepository.findById(request.getCycleId())
                    .orElseThrow(() -> new NotFoundException("Cycle not found"));
            form.setCycle(cycle);
        }

        form.setCreatedBy(authService.getCurrentUser().getId());

        if (request.getFormSetId() != null) {
            AppraisalFormSet formSet = formSetRepository.findById(request.getFormSetId())
                    .orElseThrow(() -> new NotFoundException("Form Set not found"));
            form.setFormSet(formSet);
            
            AppraisalForm saved = formRepository.save(form);
            
            // Update the set's pointer based on form type
            if (request.getFormType() == ace.org.epms_backend.enums.FormType.SELF_ASSESSMENT) {
                formSet.setSelfAssessmentForm(saved);
            } else if (request.getFormType() == ace.org.epms_backend.enums.FormType.MANAGER_EVALUATION) {
                formSet.setManagerEvaluationForm(saved);
            }
            formSetRepository.save(formSet);
            return saved.getFormId();
        }

        return formRepository.save(form).getFormId();
    }

    @Override
    @Transactional
    public Long addCategory(Long formId, CategoryRequest request) {
        AppraisalForm form = formRepository.findById(formId)
                .orElseThrow(() -> new NotFoundException("Form not found"));

        FormCategory category = new FormCategory();
        category.setForm(form);
        category.setCategoryName(request.getCategoryName());
        category.setIsActive(true);
        return categoryRepository.save(category).getCategoryId();
    }

    @Override
    @Transactional
    public Long addQuestion(Long categoryId, QuestionRequest request) {
        FormCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NotFoundException("Category not found"));

        Question question = new Question();
        question.setCategory(category);
        question.setQuestionText(request.getQuestionText());
        question.setQuestionType(QuestionType.valueOf(request.getQuestionType()));
        if (request.getSecondaryQuestionType() != null) {
            question.setSecondaryQuestionType(QuestionType.valueOf(request.getSecondaryQuestionType()));
        }
        question.setIsRequired(request.getIsRequired());
        question.setIsActive(true);
        return questionRepository.save(question).getQuestionId();
    }

    @Override
    public FullFormResponse getFullForm(Long formId) {
        AppraisalForm form = formRepository.findById(formId)
                .orElseThrow(() -> new NotFoundException("Form not found"));

        List<FormCategory> categories = categoryRepository.findByForm_FormId(formId);
        List<Question> allQuestions = questionRepository.findByCategory_Form_FormId(formId);

        List<CategoryDTO> categoryDTOs = categories.stream().map(cat -> {
            List<QuestionDTO> questionDTOs = allQuestions.stream()
                    .filter(q -> q.getCategory().getCategoryId().equals(cat.getCategoryId()))
                    .map(q -> QuestionDTO.builder()
                            .questionId(q.getQuestionId())
                            .questionText(q.getQuestionText())
                            .questionType(q.getQuestionType() != null ? q.getQuestionType().name() : null)
                            .secondaryQuestionType(q.getSecondaryQuestionType() != null ? q.getSecondaryQuestionType().name() : null)
                            .isRequired(q.getIsRequired())
                            .build())
                    .toList();

            return CategoryDTO.builder()
                    .categoryId(cat.getCategoryId())
                    .categoryName(cat.getCategoryName())
                    .questions(questionDTOs)
                    .build();
        }).toList();

        return FullFormResponse.builder()
                .formId(form.getFormId())
                .formName(form.getFormName())
                .formType(form.getFormType())
                .cycleId(form.getCycle() != null ? form.getCycle().getCycleId() : null)
                .cycleName(form.getCycle() != null ? form.getCycle().getCycleName() : null)
                .categories(categoryDTOs)
                .isAssigned(appraisalRepository.existsByFormIdInFormSet(form.getFormId()))
                .build();
    }

    @Override
    @Transactional
    public Long cloneForm(Long formId) {
        AppraisalForm originalForm = formRepository.findById(formId)
                .orElseThrow(() -> new NotFoundException("Original form not found"));

        AppraisalForm newForm = new AppraisalForm();
        newForm.setFormName(originalForm.getFormName() + " (Copy)");
        newForm.setFormType(originalForm.getFormType());
        AppraisalForm savedForm = formRepository.save(newForm);

        List<FormCategory> originalCategories = categoryRepository.findByForm_FormId(formId);
        for (FormCategory origCat : originalCategories) {
            FormCategory newCat = new FormCategory();
            newCat.setForm(savedForm);
            newCat.setCategoryName(origCat.getCategoryName());
            newCat.setIsActive(origCat.getIsActive());
            FormCategory savedCat = categoryRepository.save(newCat);

            List<Question> originalQuestions = questionRepository.findByCategory_CategoryId(origCat.getCategoryId());
            for (Question origQ : originalQuestions) {
                Question newQ = new Question();
                newQ.setCategory(savedCat);
                newQ.setQuestionText(origQ.getQuestionText());
                newQ.setQuestionType(origQ.getQuestionType());
                newQ.setSecondaryQuestionType(origQ.getSecondaryQuestionType());
                newQ.setIsRequired(origQ.getIsRequired());
                newQ.setIsActive(origQ.getIsActive());
                questionRepository.save(newQ);
            }
        }

        return savedForm.getFormId();
    }

    @Override
    @Transactional
    public void updateFormStatus(Long formId, Boolean isActive) {
        AppraisalForm form = formRepository.findById(formId)
                .orElseThrow(() -> new NotFoundException("Form not found"));
        // Logic for isActive on form if needed
    }

    @Override
    @Transactional
    public void updateForm(Long formId, AppraisalFormRequest request) {
        AppraisalForm form = formRepository.findById(formId)
                .orElseThrow(() -> new NotFoundException("Form not found"));

        form.setFormName(request.getFormName());
        form.setFormType(request.getFormType());
        if (request.getCycleId() != null) {
            AppraisalCycle cycle = cycleRepository.findById(request.getCycleId())
                    .orElseThrow(() -> new NotFoundException("Cycle not found"));
            form.setCycle(cycle);
        }
        formRepository.save(form);
    }

    @Override
    @Transactional
    public void updateCategory(Long categoryId, CategoryRequest request) {
        FormCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NotFoundException("Category not found"));

        category.setCategoryName(request.getCategoryName());
        categoryRepository.save(category);
    }

    @Override
    @Transactional
    public void updateQuestion(Long questionId, QuestionRequest request) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new NotFoundException("Question not found"));

        question.setQuestionText(request.getQuestionText());
        question.setQuestionType(QuestionType.valueOf(request.getQuestionType()));
        question.setIsRequired(request.getIsRequired());
        questionRepository.save(question);
    }

    @Override
    @Transactional
    public void deleteForm(Long formId) {
        if (appraisalRepository.existsByFormIdInFormSet(formId)) {
            throw new RuntimeException("Cannot delete form. It is currently in use by active appraisals.");
        }
        formRepository.deleteById(formId);
    }

    @Override
    @Transactional
    public void deleteCategory(Long categoryId) {
        FormCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NotFoundException("Category not found"));

        if (appraisalRepository.existsByFormIdInFormSet(category.getForm().getFormId())) {
            throw new RuntimeException("Cannot delete category. The associated form is in use.");
        }
        categoryRepository.delete(category);
    }

    @Override
    @Transactional
    public void deleteQuestion(Long questionId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new NotFoundException("Question not found"));

        if (appraisalRepository.existsByFormIdInFormSet(question.getCategory().getForm().getFormId())) {
            throw new RuntimeException("Cannot delete question. The associated form is in use.");
        }
        questionRepository.delete(question);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppraisalFormResponse> getAllForms() {
        return formRepository.findAll().stream()
                .map(form -> AppraisalFormResponse.builder()
                        .formId(form.getFormId())
                        .formName(form.getFormName())
                        .formType(form.getFormType() != null ? form.getFormType().name() : null)
                        .cycleId(form.getCycle() != null ? form.getCycle().getCycleId() : null)
                        .cycleName(form.getCycle() != null ? form.getCycle().getCycleName() : null)
                        .createdBy(form.getCreatedBy())
                        .createdAt(form.getCreatedAt())
                        .updatedAt(form.getUpdatedAt())
                        .isAssigned(appraisalRepository.existsByFormIdInFormSet(form.getFormId()))
                        .build())
                .collect(Collectors.toList());
    }
}
