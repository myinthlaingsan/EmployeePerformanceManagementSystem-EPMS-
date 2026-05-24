package ace.org.epms_backend.dto.continuous;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingPulseResponse {
    private long totalActionItems;
    private long completedActionItems;
    private List<PerformanceHistoryResponse> meetingHistory;
    private List<PerformanceHistoryResponse> actionHistory;
    private List<MeetingActionItemResponse> actionItems;
}
