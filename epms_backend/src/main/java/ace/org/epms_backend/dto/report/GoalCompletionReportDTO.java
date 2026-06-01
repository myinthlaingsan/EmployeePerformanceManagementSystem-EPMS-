package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoalCompletionReportDTO {
    private int total;
    private int completed;
    private int inProgress;
    private int notStarted;
    private int offTrack;
    private double completionRate;
}
