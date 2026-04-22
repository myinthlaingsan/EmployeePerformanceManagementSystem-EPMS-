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
}
