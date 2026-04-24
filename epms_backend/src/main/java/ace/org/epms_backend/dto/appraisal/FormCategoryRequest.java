package ace.org.epms_backend.dto.appraisal;

import lombok.Data;

@Data
public class FormCategoryRequest {
    private Long formId;
    private String categoryName;
}
