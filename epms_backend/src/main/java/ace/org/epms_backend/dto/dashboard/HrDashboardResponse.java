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
public class HrDashboardResponse {
    private long totalEmployeesUnderReview;
    private double appraisalCompletionRate;
    private long pendingSelfAssessments;
    private long pendingManagerReviews;
    private long openPips;
    private long promotionCandidates;
    private List<DepartmentPerformance> departmentPerformance;
    private List<TopPerformer> topPerformers;
    private List<DashboardAlert> alerts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DepartmentPerformance {
        private String departmentName;
        private double averageScore;
        private int employeeCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopPerformer {
        private String employeeName;
        private String department;
        private double score;
        private String photoUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardAlert {
        private String title;
        private String message;
        private String type; // info, warning, danger
        private String timestamp;
    }
}
