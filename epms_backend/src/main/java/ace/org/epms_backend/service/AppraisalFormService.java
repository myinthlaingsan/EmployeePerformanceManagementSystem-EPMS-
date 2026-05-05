package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.appraisal.*;
import java.util.List;

public interface AppraisalFormService {
    Long createForm(AppraisalFormRequest request);
    Long addCategory(Long formId, CategoryRequest request);
    Long addQuestion(Long categoryId, QuestionRequest request);
    FullFormResponse getFullForm(Long formId);
    Long cloneForm(Long formId);
    void updateFormStatus(Long formId, Boolean isActive);
}
