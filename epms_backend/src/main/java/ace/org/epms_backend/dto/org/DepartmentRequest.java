package ace.org.epms_backend.dto.org;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentRequest {
    @NotBlank(message = "Department code is required")
    private String departmentCode;
    @NotBlank(message = "Department name is required")
    private String departmentName;
}
