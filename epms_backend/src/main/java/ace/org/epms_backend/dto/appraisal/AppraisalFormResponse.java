package ace.org.epms_backend.dto.appraisal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    private Instant createdAt;
    private Instant updatedAt;
    @JsonProperty("isAssigned")
    private boolean isAssigned;
}
