package ace.org.epms_backend.dto.appraisal;

import lombok.Data;

@Data
public class QuestionResponse {
    private Long questionId;
    private Long categoryId;
    private String questionText;
    private String questionType;
    private Boolean isRequired;
}
