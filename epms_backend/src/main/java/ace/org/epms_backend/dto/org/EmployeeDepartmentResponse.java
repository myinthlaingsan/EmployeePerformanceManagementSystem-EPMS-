package ace.org.epms_backend.dto.org;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDepartmentResponse {
    private Long id;
    private Long employeeId;
    private Long currentDepartmentId;
    private String currentDepartmentName;
    private Long parentDepartmentId;
    private String parentDepartmentName;
    private Boolean isCurrent;
    private Instant createdAt;
}
