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
public class AdminDashboardResponse {
    private long totalEmployees;
    private long totalDepartments;
    private long totalManagers;
    private long activeUsers;
    private long lockedAccounts;
    private long activeCycles;
    private List<RecentActivity> recentActivities;
    private List<SecurityAlert> securityAlerts;
    private Long failedLoginsLast24h;
    private Long accountsCreatedThisMonth;
    private Long accountsDeactivatedThisMonth;
    private String activeCycleName;
    private String cycleStartDate;
    private String cycleEndDate;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivity {
        private String action;
        private String user;
        private String timestamp;
        private String module;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SecurityAlert {
        private String event;
        private String severity; // LOW, MEDIUM, HIGH
        private String timestamp;
        private String details;
    }
}
