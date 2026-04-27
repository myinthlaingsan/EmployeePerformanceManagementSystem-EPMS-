package ace.org.epms_backend.dto.appraisal.form;

import ace.org.epms_backend.enums.FormType;
import lombok.Data;
import java.util.List;

@Data
public class FullFormResponse {
    private Long formId;
    private String formName;
    private FormType formType;
    private List<CategoryResponse> categories;
}
