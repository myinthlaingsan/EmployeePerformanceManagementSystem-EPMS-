package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.appraisal.*;
import ace.org.epms_backend.model.appraisal.Appraisal;

public interface AppraisalService {

    void createAppraisal(AppraisalCreateRequest request);

    void assignAppraisal(AppraisalAssignRequest request);

    Appraisal getAppraisal(Long id);

    void finalizeAppraisal(Long appraisalId);
}
