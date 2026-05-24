package ace.org.epms_backend.dto.appraisal;

import ace.org.epms_backend.enums.FeedbackRelationship;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppraisalFormResponse {
    private Long formId;
    private String formName;
    private String formType;
    private Long cycleId;
    private String cycleName;
    private Long createdBy;
    private FeedbackRelationship targetRelationship;
    private Instant createdAt;
    private Instant updatedAt;
}
