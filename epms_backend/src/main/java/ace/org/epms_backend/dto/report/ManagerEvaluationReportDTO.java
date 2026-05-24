package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagerEvaluationReportDTO {
    private String employeeName;
    private String employeeCode;
    private String departmentName;
    private String positionName;
    private String managerName;
    private String cycleName;
    private String totalScore;
    private String finalComment;
    private String submittedAt;
    private List<ManagerEvaluationReportQuestionDTO> questions;
}
