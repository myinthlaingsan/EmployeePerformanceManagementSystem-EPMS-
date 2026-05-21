package ace.org.epms_backend.dto.feedback360;

import ace.org.epms_backend.enums.CalibrationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackSummaryResponse {
    private Long summaryId;
    private Long targetUserId;
    private String targetUserName;
    private String cycleName;

    // Per-relationship breakdowns
    private List<CategoryScore> selfScores;
    private List<CategoryScore> managerScores;
    private List<CategoryScore> peerScores;
    private List<CategoryScore> subordinateScores;

    // Combined others (peer + subordinate + manager) — kept for backward compatibility
    private List<CategoryScore> scores;

    private List<DetailedComment> detailedComments;
    private Double totalAverageScore;
    private Boolean isFinalized;

    // Calibration fields
    private String managerSummary;
    private BigDecimal calibratedFinalScore;
    private CalibrationStatus calibrationStatus;
    private String calibrationReason;
    private Instant calibrationDate;
    private Long calibratedBy;
    private Instant finalizedAt;
    private Long finalizedBy;
}
