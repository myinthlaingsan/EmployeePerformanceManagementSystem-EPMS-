package ace.org.epms_backend.dto.appraisal;

import ace.org.epms_backend.enums.FormType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppraisalFormRequest {
    @NotBlank(message = "Form name is required")
    private String formName;
    
    @NotNull(message = "Form type is required")
    private FormType formType;
    
    @NotNull(message = "Cycle ID is required")
    private Long cycleId;
    
    private Long formSetId;
    private Long createdBy;
}



