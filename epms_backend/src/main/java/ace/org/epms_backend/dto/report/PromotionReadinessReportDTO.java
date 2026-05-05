package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionReadinessReportDTO {
    private String employeeName;
    private String currentPosition;
    private String currentLevel;
    private int yearsInPosition;
    private String lastAppraisalRating;
    private boolean isReady;
    private String recommendation;
}
