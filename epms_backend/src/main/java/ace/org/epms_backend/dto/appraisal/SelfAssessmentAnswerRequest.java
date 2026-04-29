package ace.org.epms_backend.dto.appraisal;

import lombok.Data;

@Data
public class SelfAssessmentAnswerRequest {
    private Long questionId;
    private String answerValue;
    private String comment;
}
