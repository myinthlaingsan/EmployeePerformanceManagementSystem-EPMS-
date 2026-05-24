package ace.org.epms_backend.dto.feedback360;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PooledFeedbackSection {
    private int submissionCount;
    private List<CategoryScore> averages;       // per-category pooled averages
    private List<String> shuffledComments;       // shuffled, no evaluator attribution
    private boolean suppressed;                  // true if submissionCount < threshold
    private String suppressionMessage;
}
