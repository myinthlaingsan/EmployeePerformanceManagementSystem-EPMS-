package ace.org.epms_backend.dto.appraisal;

import lombok.Data;

@Data
public class FormCategoryResponse {
    private Long categoryId;
    private Long formId;
    private String categoryName;
}
