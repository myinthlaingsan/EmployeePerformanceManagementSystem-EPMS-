package ace.org.epms_backend.dto.feedback360;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionRatingReport {
    private String questionText;
    private String categoryName;
    private Double averageScore; // 0-100% or 1-5
    private Integer responseCount;
}
