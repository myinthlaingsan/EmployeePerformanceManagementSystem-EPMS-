package ace.org.epms_backend.dto.employee;

import lombok.Data;

@Data
public class TeamResponse {
    private Long teamId;
    private String teamName;
    private String departmentName;
    private Long departmentId;
}
