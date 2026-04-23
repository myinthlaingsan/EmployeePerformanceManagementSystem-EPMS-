package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.appraisal.*;
import ace.org.epms_backend.model.appraisal.Appraisal;

import java.util.List;

public interface AppraisalService {

    AppraisalResponse createAppraisal(AppraisalCreateRequest request);

    List<AppraisalResponse> getAll();

    AppraisalResponse getById(Long id);

    AppraisalResponse assignAppraisal(AppraisalAssignRequest request);

    AppraisalResponse calculate(Long id);

    AppraisalResponse lock(Long id);

    AppraisalResponse finalizeAppraisal(Long id);

    AppraisalResponse update(Long id, AppraisalUpdateRequest request);

    void delete(Long id);

    List<AppraisalResponse> getByEmployeeId(Long employeeId);

    List<AppraisalResponse> getByManagerId(Long managerId);

    List<AppraisalResponse> getByCycleId(Long cycleId);

    AppraisalResponse submitSelfAssessment(Long id);

    AppraisalResponse submitManagerEvaluation(Long id);

    AppraisalResponse employeeSignOff(Long id);

    AppraisalResponse managerSignOff(Long id);

    AppraisalDetailsResponse getAppraisalDetails(Long id);
}
