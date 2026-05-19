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
public class ManagerPerformanceSummaryResponse {
    private long totalMeetingsHeld;
    private double actionItemsCompletionRate;
    private List<String> topPositiveKeywords;
}
