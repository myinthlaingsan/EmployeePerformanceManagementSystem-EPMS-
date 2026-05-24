package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FeedbackCommentDTO {
    private String categoryName;
    private String relationship;
    private String comment;
    private String evaluatorName;
    private Integer score;
}
