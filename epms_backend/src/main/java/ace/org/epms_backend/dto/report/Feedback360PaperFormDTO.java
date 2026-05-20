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
public class Feedback360PaperFormDTO {
    private Long requestId;
    private String targetEmployeeName;
    private String targetEmployeeCode;
    private String targetDepartmentName;
    private String targetPositionName;
    private String evaluatorEmployeeName;
    private String relationshipType;
    private String cycleName;
    private List<Feedback360PaperFormQuestionDTO> questions;
}
