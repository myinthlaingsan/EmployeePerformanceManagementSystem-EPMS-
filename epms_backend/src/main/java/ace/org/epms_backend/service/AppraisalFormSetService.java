package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.appraisal.AppraisalFormSetRequest;
import ace.org.epms_backend.dto.appraisal.AppraisalFormSetResponse;

import java.util.List;

public interface AppraisalFormSetService {
    List<AppraisalFormSetResponse> getAllFormSets();
    AppraisalFormSetResponse createFormSet(AppraisalFormSetRequest request);
    List<AppraisalFormSetResponse> getByCycle(Long cycleId);
    String syncFormSets();
    AppraisalFormSetResponse updateFormSet(Long id, AppraisalFormSetRequest request);
    void deleteFormSet(Long id);
}
