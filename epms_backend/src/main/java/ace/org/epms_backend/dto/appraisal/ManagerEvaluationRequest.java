package ace.org.epms_backend.dto.appraisal;

import lombok.Data;

import java.util.List;

@Data
public class ManagerEvaluationRequest {

    private Long appraisalId;

    private List<ManagerAnswerDTO> answers;

    @Data
    public static class ManagerAnswerDTO {
        private Long questionId;
        private Integer ratingValue;
        private String comment;
    }
}