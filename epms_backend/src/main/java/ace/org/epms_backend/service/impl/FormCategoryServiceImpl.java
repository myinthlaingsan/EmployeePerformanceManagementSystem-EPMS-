package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.appraisal.FormCategoryRequest;
import ace.org.epms_backend.dto.appraisal.FormCategoryResponse;
import ace.org.epms_backend.exception.ResourceNotFoundException;
import ace.org.epms_backend.mapper.FormCategoryMapper;
import ace.org.epms_backend.model.appraisal.AppraisalForm;
import ace.org.epms_backend.model.appraisal.FormCategory;
import ace.org.epms_backend.repository.AppraisalFormRepository;
import ace.org.epms_backend.repository.FormCategoryRepository;
import ace.org.epms_backend.service.FormCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FormCategoryServiceImpl implements FormCategoryService {

    private final FormCategoryRepository formCategoryRepository;
    private final AppraisalFormRepository appraisalFormRepository;
    private final FormCategoryMapper formCategoryMapper;

    @Override
    @Transactional
    public FormCategoryResponse create(FormCategoryRequest request) {
        AppraisalForm form = appraisalFormRepository.findById(request.getFormId())
                .orElseThrow(() -> new ResourceNotFoundException("AppraisalForm not found with id: " + request.getFormId()));

        FormCategory category = formCategoryMapper.toEntity(request);
        category.setForm(form);
        category = formCategoryRepository.save(category);

        return formCategoryMapper.toResponse(category);
    }

    @Override
    public List<FormCategoryResponse> getByFormId(Long formId) {
        if (formId == null) {
            return formCategoryMapper.toResponseList(formCategoryRepository.findAll());
        }
        List<FormCategory> categories = formCategoryRepository.findByForm_FormId(formId);
        return formCategoryMapper.toResponseList(categories);
    }

    @Override
    public FormCategoryResponse getById(Long id) {
        FormCategory category = getCategoryById(id);
        return formCategoryMapper.toResponse(category);
    }

    @Override
    @Transactional
    public FormCategoryResponse update(Long id, FormCategoryRequest request) {
        FormCategory category = getCategoryById(id);

        if (!category.getForm().getFormId().equals(request.getFormId())) {
            AppraisalForm form = appraisalFormRepository.findById(request.getFormId())
                    .orElseThrow(() -> new ResourceNotFoundException("AppraisalForm not found with id: " + request.getFormId()));
            category.setForm(form);
        }

        formCategoryMapper.updateEntityFromRequest(request, category);
        category = formCategoryRepository.save(category);
        return formCategoryMapper.toResponse(category);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        FormCategory category = getCategoryById(id);
        // Hard-delete as chosen in the open question defaults
        formCategoryRepository.delete(category);
    }

    private FormCategory getCategoryById(Long id) {
        return formCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FormCategory not found with id: " + id));
    }
}
