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
public class KpiActualsCompletionReportDTO {
    private String generatedAt;
    private Long cycleId;
    private String cycleName;
    private int thresholdDays;
    private int totalEmployees;
    private int overdueEmployeeCount;
    private int upToDateEmployeeCount;
    private int noGoalEmployeeCount;
    private double overdueRate;
    private List<KpiActualsEmployeeRowDTO> employeeRows;
}
