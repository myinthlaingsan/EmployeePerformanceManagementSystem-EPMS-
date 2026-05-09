package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.appraisal.*;

import java.util.List;

public interface AppraisalService {

    AppraisalResponse assignAppraisal(AppraisalAssignRequest request);

    List<AppraisalResponse> assignBulk(AppraisalBulkAssignRequest request);

    List<AppraisalResponse> getMyAssessments();

    List<AppraisalResponse> getTeamEvaluations();

    List<AppraisalResponse> getDepartmentAppraisals();

    List<AppraisalResponse> getAppraisalsToEvaluate();

    EmployeeSelfAssessmentViewResponse getEmployeeView(Long appraisalId);

    AppraisalResponse getById(Long id);

    ScoreBreakdownResponse calculate(Long id);

    AppraisalResponse approve(Long id, String comment);

    AppraisalResponse finalizeAppraisal(Long id);

    AppraisalResponse employeeSignOff(Long id, String comment);

    AppraisalResponse managerSignOff(Long id, String comment);
 
    void deleteAppraisal(Long id);
}


