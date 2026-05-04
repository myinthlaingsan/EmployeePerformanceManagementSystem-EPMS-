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
public class AppraisalStatusReportDTO {
    private String cycleName;
    private int totalEmployees;
    private int completed;
    private int pending;
    private int inProgress;
    private List<EmployeeStatusDTO> employeeStatuses;
}
