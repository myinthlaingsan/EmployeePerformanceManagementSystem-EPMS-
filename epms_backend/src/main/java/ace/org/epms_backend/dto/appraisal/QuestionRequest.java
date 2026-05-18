package ace.org.epms_backend.dto.appraisal;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class QuestionRequest {
    @NotBlank(message = "Question text is required")
    private String questionText;
    
    @NotBlank(message = "Question type is required")
    private String questionType;
    
    private String secondaryQuestionType;
    private Boolean isRequired;
    private Long categoryId;
}