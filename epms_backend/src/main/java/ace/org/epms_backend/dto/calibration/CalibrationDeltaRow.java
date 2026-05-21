package ace.org.epms_backend.dto.calibration;

import ace.org.epms_backend.enums.CalibrationStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class CalibrationDeltaRow {
    private Long summaryId;
    private Long employeeId;
    private String employeeName;
    private String departmentName;
    private BigDecimal rawFinalScore;
    private BigDecimal calibratedFinalScore;
    private BigDecimal delta;
    private CalibrationStatus calibrationStatus;
    private String calibrationReason;
    private Instant calibrationDate;
}
