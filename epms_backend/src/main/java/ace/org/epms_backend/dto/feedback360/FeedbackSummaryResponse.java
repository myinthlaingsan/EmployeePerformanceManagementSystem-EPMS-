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
public class FeedbackSummaryResponse {
    private Long targetUserId;
    private String targetUserName;
    private String cycleName;
    private List<CategoryScore> selfScores;
    private List<CategoryScore> othersScores;
    private List<DetailedComment> detailedComments;
}
