package ace.org.epms_backend.dto.employee;

import lombok.Data;

@Data
public class TeamMemberResponse {
    private Long employeeId;
    private String staffName;
    private String positionName;
    private Boolean isPrimary;
}
