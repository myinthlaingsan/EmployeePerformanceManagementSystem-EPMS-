package ace.org.epms_backend.dto.employee;

import lombok.Data;

@Data
public class TeamRequest {
    private String teamName;
    private Long departmentId;
}
