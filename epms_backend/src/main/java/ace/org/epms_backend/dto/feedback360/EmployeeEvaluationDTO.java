package ace.org.epms_backend.dto.feedback360;

import ace.org.epms_backend.enums.FeedbackRelationship;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class EmployeeEvaluationDTO {
    private Long employeeId;
    private String staffName;
    private FeedbackRelationship relationship;
}