package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionReadinessReportDTO {
    private String employeeName;
    private String departmentName;
    private String currentPosition;
    private String currentLevel;
    private int yearsInPosition;
    private String historicalScores; // e.g. "2023: 85, 2024: 90"
    private String lastAppraisalRating;
    private Boolean isReady;
    private String recommendation;
    private String justification;
}
