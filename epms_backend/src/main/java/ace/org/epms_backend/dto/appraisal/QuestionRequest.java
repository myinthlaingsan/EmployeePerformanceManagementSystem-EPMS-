package ace.org.epms_backend.dto.appraisal;

import lombok.Data;

@Data
public class QuestionRequest {
    private String questionText;
    private String questionType;
    private String secondaryQuestionType;
    private Boolean isRequired;
    private Long categoryId;
}