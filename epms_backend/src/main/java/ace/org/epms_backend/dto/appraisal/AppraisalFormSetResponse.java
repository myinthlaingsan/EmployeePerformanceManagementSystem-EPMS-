package ace.org.epms_backend.dto.appraisal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppraisalFormSetResponse {
    private Long id;
    private String name;
    private Long cycleId;
    private String cycleName;
    private Long selfAssessmentFormId;
    private String selfAssessmentFormName;
    private Long managerEvaluationFormId;
    private String managerEvaluationFormName;
    @JsonProperty("isAssigned")
    private boolean isAssigned;
}
