package ace.org.epms_backend.dto.employee;

import lombok.Data;

@Data
public class TeamAssignmentRequest {
    private Long employeeId;
    private Long teamId;
    private Boolean isPrimary;
}
