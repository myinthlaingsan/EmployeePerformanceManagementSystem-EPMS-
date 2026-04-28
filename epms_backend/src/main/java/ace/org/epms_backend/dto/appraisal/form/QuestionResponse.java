package ace.org.epms_backend.dto.appraisal.form;

import lombok.Data;

@Data
public class QuestionResponse {
    private Long questionId;
    private String questionText;
    private String questionType;
    private Boolean isRequired;
}
