package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiActualsEmployeeRowDTO {
    private Long employeeId;
    private String employeeName;
    private String departmentName;
    private String positionName;
    private int totalKpiItems;
    private int overdueItemCount;
    private String lastUpdatedAt;
    private long daysSinceLastUpdate;
    private boolean overdue;
    private String status; // "OVERDUE", "UP TO DATE", "NO GOAL SET"

    
}
