package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagerEvaluationReportQuestionDTO {
    private String categoryName;
    private String questionText;
    private String employeeRating;
    private String employeeComment;
    private String managerRating;
    private String managerComment;
}
