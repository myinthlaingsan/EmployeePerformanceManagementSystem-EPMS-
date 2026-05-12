package ace.org.epms_backend.dto.appraisal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionViewDTO {
    private String questionText;
    private String questionType;
    private String secondaryQuestionType;
    private Integer ratingValue;
    private Boolean isCompleted;
    private String comment;
}
