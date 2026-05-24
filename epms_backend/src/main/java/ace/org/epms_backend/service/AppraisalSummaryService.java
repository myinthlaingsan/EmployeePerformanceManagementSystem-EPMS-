package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.appraisal.AppraisalSummaryResponse;

import java.util.List;

public interface AppraisalSummaryService {

    List<AppraisalSummaryResponse> getByCycleId(Long cycleId);

    List<AppraisalSummaryResponse> getByEmployeeId(Long employeeId);
}
