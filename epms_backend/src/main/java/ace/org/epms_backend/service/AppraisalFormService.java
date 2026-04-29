package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.appraisal.form.AppraisalFormRequest;
import ace.org.epms_backend.dto.appraisal.AppraisalFormResponse;

import java.util.List;

public interface AppraisalFormService {
    AppraisalFormResponse create(AppraisalFormRequest request);

    List<AppraisalFormResponse> getAll();

    AppraisalFormResponse getById(Long id);

    AppraisalFormResponse update(Long id, AppraisalFormRequest request);

    void delete(Long id);

}
