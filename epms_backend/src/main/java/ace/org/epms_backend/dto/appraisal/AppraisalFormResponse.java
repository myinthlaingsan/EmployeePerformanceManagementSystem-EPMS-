package ace.org.epms_backend.dto.appraisal;

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
    private Long createdBy;
    private Instant createdAt;
    private Instant updatedAt;
}
