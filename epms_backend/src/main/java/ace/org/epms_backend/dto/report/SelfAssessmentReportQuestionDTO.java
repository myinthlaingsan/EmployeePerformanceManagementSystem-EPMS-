package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SelfAssessmentReportQuestionDTO {
    private String categoryName;
    private String questionText;
    private Boolean isYes;
    private Boolean isNo;
    private Integer ratingValue;
    private String comment;
}
