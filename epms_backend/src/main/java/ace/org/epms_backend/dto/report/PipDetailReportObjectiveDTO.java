package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PipDetailReportObjectiveDTO {
    private String objectiveTitle;
    private String objectiveDescription;
    private String successCriteria;
    private String progressPercent;
    private String status;
}
