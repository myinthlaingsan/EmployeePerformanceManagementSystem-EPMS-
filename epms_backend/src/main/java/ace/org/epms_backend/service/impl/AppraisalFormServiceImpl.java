package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.appraisal.form.*;
import ace.org.epms_backend.enums.QuestionType;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.appraisal.*;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.AppraisalFormService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppraisalFormServiceImpl implements AppraisalFormService {

    private final AppraisalFormRepository formRepository;
    private final FormCategoryRepository categoryRepository;
    private final QuestionRepository questionRepository;

    @Override
    @Transactional
    public Long createForm(AppraisalFormRequest request) {
        AppraisalForm form = AppraisalForm.builder()
                .formName(request.getFormName())
                .formType(request.getFormType())
                .build();
        return formRepository.save(form).getFormId();
    }

    @Override
    @Transactional
    public void addCategory(Long formId, CategoryRequest request) {
        AppraisalForm form = formRepository.findById(formId)
                .orElseThrow(() -> new NotFoundException("Form not found"));
        
        FormCategory category = FormCategory.builder()
                .form(form)
                .categoryName(request.getCategoryName())
                .isActive(true)
                .build();
        categoryRepository.save(category);
    }

    @Override
    @Transactional
    public void addQuestion(Long categoryId, QuestionRequest request) {
        FormCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NotFoundException("Category not found"));

        Question question = Question.builder()
                .category(category)
                .questionText(request.getQuestionText())
                .questionType(QuestionType.valueOf(request.getQuestionType()))
                .isRequired(request.getIsRequired())
                .isActive(true)
                .build();
        questionRepository.save(question);
    }

    @Override
    public FullFormResponse getFullForm(Long formId) {
        AppraisalForm form = formRepository.findById(formId)
                .orElseThrow(() -> new NotFoundException("Form not found"));

        FullFormResponse response = new FullFormResponse();
        response.setFormId(form.getFormId());
        response.setFormName(form.getFormName());
        response.setFormType(form.getFormType());

        response.setCategories(categoryRepository.findByForm_FormId(formId).stream()
                .map(cat -> {
                    CategoryResponse cr = new CategoryResponse();
                    cr.setCategoryId(cat.getCategoryId());
                    cr.setCategoryName(cat.getCategoryName());
                    cr.setQuestions(questionRepository.findByCategory_CategoryId(cat.getCategoryId()).stream()
                            .map(q -> {
                                QuestionResponse qr = new QuestionResponse();
                                qr.setQuestionId(q.getQuestionId());
                                qr.setQuestionText(q.getQuestionText());
                                qr.setQuestionType(q.getQuestionType().name());
                                qr.setIsRequired(q.getIsRequired());
                                return qr;
                            }).collect(Collectors.toList()));
                    return cr;
                }).collect(Collectors.toList()));

        return response;
    }

    @Override
    @Transactional
    public void updateFormStatus(Long formId, Boolean isActive) {
        AppraisalForm form = formRepository.findById(formId)
                .orElseThrow(() -> new NotFoundException("Form not found"));
        // Assuming we add isActive to AppraisalForm or just handle it here
    }
}
