package ace.org.epms_backend.dto.kpi;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentResult {
    private Long employeeId;
    private String employeeName;
    private String status; // SUCCESS, FAILED, SKIPPED
    private String reason;
}
