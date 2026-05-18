package ace.org.epms_backend.dto.feedback360;

import ace.org.epms_backend.enums.FeedbackRelationship;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingFeedbackDTO {

    private Long requestId;

    // Evaluator info
    private Long evaluatorId;
    private String evaluatorName;
    private String evaluatorDepartmentName;

    // Target info
    private Long targetUserId;
    private String targetUserName;
    private String targetDepartmentName;

    // Cycle info
    private Long cycleId;
    private String cycleName;
    private LocalDate cycleEndDate;

    // Relationship
    private FeedbackRelationship relationship;
    private Boolean isAnonymous;
}
