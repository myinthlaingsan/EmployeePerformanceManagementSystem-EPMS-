package ace.org.epms_backend.dto.calibration;

import ace.org.epms_backend.enums.CalibrationSessionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class CalibrationSessionResponse {
    private Long id;
    private Long cycleId;
    private String cycleName;
    private Long departmentId;
    private String departmentName;
    private String name;
    private String facilitator;
    private Instant scheduledAt;
    private Instant completedAt;
    private CalibrationSessionStatus status;
    private String notes;
    private List<Long> summaryIds;
}
