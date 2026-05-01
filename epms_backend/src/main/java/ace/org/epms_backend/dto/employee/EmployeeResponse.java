package ace.org.epms_backend.dto.employee;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeResponse {
    private Long id;
    private String employeeCode;
    private String staffName;
    private String email;
    private String phoneNo;
    private String positionName;
    private String levelName;
    private Integer levelRank;
    private String currentDepartmentName;
    private String parentDepartmentName;
    private Long directManagerId;
    private String directManagerName;
    private List<String> roles;
    private List<String> permissions;
}
