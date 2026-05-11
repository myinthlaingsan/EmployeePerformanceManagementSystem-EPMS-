package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeReportDTO {
    private String employeeCode;
    private String staffName;
    private String email;
    private String departmentName;
    private String positionName;
    private String levelName;
    private String teamName;
    private String directManagerName;
    private String status; // Active/Inactive
    private String joinedDate;
}
