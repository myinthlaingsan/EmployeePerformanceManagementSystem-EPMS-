package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeStatusDTO {
    private String employeeName;
    private String departmentName;
    private String status;
    private String selfAssessmentDate;
    private String managerEvaluationDate;
    private String feedbackCompletionRate;
}
