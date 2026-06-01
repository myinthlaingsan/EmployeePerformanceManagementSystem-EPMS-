package ace.org.epms_backend.dto.kpi;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiAuditLogResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;      // resolved from EmployeeRepository
    private String departmentName;    // resolved from EmployeeDepartment
    private Long goalSetId;
    private Long itemId;
    private String action;            // PHASE_OPENED, PHASE_CLOSED, PHASE_LOCKED, KPI_ADDED, KPI_REVISED, KPI_DELETED, etc.
    private String changeReason;
    private String changeDetails;
    private Long changedBy;
    private String changedByName;     // resolved from EmployeeRepository
    private Instant createdAt;
}
