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
public class ManagerDashboardResponse {
    private int teamSize;
    private int reviewsCompleted;
    private int totalReviews;
    private int pendingReviews;
    private int feedbackRequests;
    private List<TeamMemberPerformance> teamPerformance;
    private List<TeamKpiProgress> teamKpis;
    private List<EmployeeDashboardResponse.DashboardTask> urgentReviews;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeamMemberPerformance {
        private String name;
        private double score;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeamKpiProgress {
        private String name;
        private int progress;
        private String color;
    }
}
