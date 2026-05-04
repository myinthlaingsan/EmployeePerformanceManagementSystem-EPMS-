package ace.org.epms_backend.dto.appraisal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionWithManagerAnswerDTO {
    private Long questionId;
    private String questionText;
    private String questionType;
    private Boolean isRequired;
    
    // Employee's answer (read-only reference)
    private Integer employeeRatingValue;
    private String employeeComment;

    // Manager's answer part
    private Long answerId;
    private Integer managerRatingValue;
    private String managerComment;
}
