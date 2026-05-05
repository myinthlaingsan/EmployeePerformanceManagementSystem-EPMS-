package ace.org.epms_backend.dto.appraisal;

import lombok.Data;

@Data
public class ManagerEvaluationAnswerRequest {
    private Long questionId;
    private Integer ratingValue;
    private String comment;
}
