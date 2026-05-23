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
    private String ratingValue;
    private String comment;
}
