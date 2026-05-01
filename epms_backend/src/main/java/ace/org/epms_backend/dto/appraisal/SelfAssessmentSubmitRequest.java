package ace.org.epms_backend.dto.appraisal;

import lombok.Data;

import java.util.List;

@Data
public class SelfAssessmentSubmitRequest {

    private Long appraisalId;

    private List<SelfAnswerDTO> answers;

    @Data
    public static class SelfAnswerDTO {
        private Long questionId;
        private String answerValue;
        private String comment;
    }
}
