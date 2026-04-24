package ace.org.epms_backend.dto.appraisal;

import lombok.Data;

@Data
public class QuestionRequest {
    private Long categoryId;
    private String questionText;
    private String questionType;
    private Boolean isRequired;
}
