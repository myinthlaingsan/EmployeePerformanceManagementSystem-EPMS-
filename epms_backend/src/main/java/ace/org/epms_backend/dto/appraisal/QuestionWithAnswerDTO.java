package ace.org.epms_backend.dto.appraisal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionWithAnswerDTO {
    private Long questionId;
    private String questionText;
    private String questionType;
    private Boolean isRequired;
    
    // Answer part (can be null if not answered yet)
    private Long answerId;
    private Integer ratingValue;
    private Boolean isCompleted;
    private String comment;
}
