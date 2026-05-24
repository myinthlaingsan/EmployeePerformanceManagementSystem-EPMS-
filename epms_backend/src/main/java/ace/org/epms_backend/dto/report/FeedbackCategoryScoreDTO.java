package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FeedbackCategoryScoreDTO {
    private String categoryName;
    private Double selfScore;
    private Double managerScore;
    private Double peerScore;
    private Double subordinateScore;
    private Double averageScore;
}
