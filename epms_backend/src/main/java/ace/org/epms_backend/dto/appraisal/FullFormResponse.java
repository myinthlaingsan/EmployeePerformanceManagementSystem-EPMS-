package ace.org.epms_backend.dto.appraisal;

import ace.org.epms_backend.enums.FormType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FullFormResponse {
    private Long formId;
    private String formName;
    private FormType formType;
    private Long cycleId;
    private String cycleName;
    private List<CategoryDTO> categories;
}

