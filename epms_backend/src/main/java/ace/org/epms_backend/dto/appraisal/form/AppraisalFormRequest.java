package ace.org.epms_backend.dto.appraisal.form;

import ace.org.epms_backend.enums.FormType;
import lombok.Data;

@Data
public class AppraisalFormRequest {
    private String formName;
    private FormType formType;
}
