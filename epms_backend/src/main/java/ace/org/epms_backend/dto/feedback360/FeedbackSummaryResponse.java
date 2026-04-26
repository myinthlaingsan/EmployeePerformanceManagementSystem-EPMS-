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
    private List<CategoryScore> othersScores; // Average of Manager, Peer, Subordinate
    
    private List<DetailedComment> detailedComments;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetailedComment {
        private String categoryName;
        private String evaluatorRole; // Manager, Peer, Subordinate, Self
        private String evaluatorName; // Masked if anonymous
        private String comment;
        private Integer score;
    }
}
