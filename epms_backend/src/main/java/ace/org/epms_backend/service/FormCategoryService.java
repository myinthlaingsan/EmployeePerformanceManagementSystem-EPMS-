package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.appraisal.FormCategoryRequest;
import ace.org.epms_backend.dto.appraisal.FormCategoryResponse;

import java.util.List;

public interface FormCategoryService {
    FormCategoryResponse create(FormCategoryRequest request);
    List<FormCategoryResponse> getByFormId(Long formId);
    FormCategoryResponse getById(Long id);
    FormCategoryResponse update(Long id, FormCategoryRequest request);
    void delete(Long id);
}
