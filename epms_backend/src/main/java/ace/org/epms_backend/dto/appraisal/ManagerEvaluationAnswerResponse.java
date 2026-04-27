package ace.org.epms_backend.dto.appraisal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagerEvaluationAnswerResponse {
    private Long id;
    private Long questionId;
    private String questionText;
    private Integer ratingValue;
    private String comment;
}
