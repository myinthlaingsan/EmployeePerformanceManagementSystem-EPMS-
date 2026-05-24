package ace.org.epms_backend.dto.feedback360;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing a single Top Management → Department Head evaluator assignment.
 * Used in the preview and response payloads for the rotation rule endpoints.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluatorAssignmentDTO {

    private Long targetEmployeeId;
    private String targetEmployeeName;
    private String targetLevelCode;       // e.g. "L04"

    private Long evaluatorId;
    private String evaluatorName;
    private String evaluatorLevelCode;    // e.g. "L01", "L02", "L03"

    private Long cycleId;
    private String cycleName;

    /** True if the Round Robin (oldest fallback) strategy was used for this assignment. */
    private boolean roundRobinFallback;
}
