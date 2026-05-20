package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Feedback360PaperFormQuestionDTO {
    private String categoryName;
    private String questionText;
    private Boolean isRequired;
    private Integer score;
    private String comment;
}
