package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PipDetailDTO {
    private String employeeName;
    private String startDate;
    private String endDate;
    private String status;
    private String objectives;
    private String progressSummary;
    private String outcome;
}
