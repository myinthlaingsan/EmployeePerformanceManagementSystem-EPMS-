package ace.org.epms_backend.dto.appraisal.form;

import lombok.Data;

@Data
public class QuestionRequest {
    private String questionText;
    private String questionType; // RATING, TEXT, etc
    private Boolean isRequired;

}
