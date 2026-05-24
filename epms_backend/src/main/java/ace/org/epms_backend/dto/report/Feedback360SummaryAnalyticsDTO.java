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
public class Feedback360SummaryAnalyticsDTO {
    private int totalRequests;
    private int completedResponses;
    private double participationRate;
    private double avgResponseTimeDays;
    private String mostCommonFeedbackTheme;
    private double selfPerceptionGap;
    private List<String> commonThemes;
}
