package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.appraisal.form.AppraisalFormRequest;
import ace.org.epms_backend.dto.appraisal.AppraisalFormResponse;
import ace.org.epms_backend.dto.appraisal.form.CategoryRequest;
import ace.org.epms_backend.dto.appraisal.form.FullFormResponse;
import ace.org.epms_backend.dto.appraisal.form.QuestionRequest;

import java.util.List;

public interface AppraisalFormService {
//    AppraisalFormResponse create(AppraisalFormRequest request);

//    List<AppraisalFormResponse> getAll();
//
//    AppraisalFormResponse getById(Long id);
//
//    AppraisalFormResponse update(Long id, AppraisalFormRequest request);
//
//    void delete(Long id);
    Long createForm(AppraisalFormRequest request);
    void addCategory(Long formId, CategoryRequest request);
    void addQuestion(Long categoryId, QuestionRequest request);
    FullFormResponse getFullForm(Long formId);
    void updateFormStatus(Long formId, Boolean isActive);
}
