package ace.org.epms_backend.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDashboardResponse {
    private double currentScore;
    private int kpiCompletionPercentage;
    private int pendingTasksCount;
    private int feedbackCount;
    private List<ScoreTrend> performanceTrend;
    private List<KpiProgress> kpiStatus;
    private List<UpcomingPhase> appraisalTimeline;
    private List<DashboardTask> tasks;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreTrend {
        private String period;
        private double score;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpiProgress {
        private String name;
        private int value;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpcomingPhase {
        private String phase;
        private String status;
        private String date;
        private boolean active;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardTask {
        private Long id;
        private String title;
        private String deadline;
        private String priority;
    }
}
