package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdpDetailDTO {
    private String employeeName;
    private String startDate;
    private String endDate;
    private String status;
    private String developmentGoals;
    private String progressUpdate;
    private String mentorFeedback;
}
