package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Feedback360IndividualReportDTO {
    private Long targetUserId;
    private String targetUserName;
    private String employeeCode;
    private String departmentName;
    private String positionName;
    private String cycleName;
    private Double selfScore;
    private Double managerScore;
    private Double peerScore;
    private Double subordinateScore;
    private Double finalScore;
    private String managerComments;
    private List<FeedbackCategoryScoreDTO> categoryScores;
    private List<FeedbackCommentDTO> comments;
}
