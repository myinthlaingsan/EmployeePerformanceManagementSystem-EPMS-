package ace.org.epms_backend.dto.appraisal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionDTO {
    private Long questionId;
    private String questionText;
    private String questionType;
    private Boolean isRequired;
    private Boolean requiresComment;
}
