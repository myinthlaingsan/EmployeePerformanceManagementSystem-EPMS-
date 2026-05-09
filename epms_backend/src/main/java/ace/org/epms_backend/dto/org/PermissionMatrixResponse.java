package ace.org.epms_backend.dto.org;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionMatrixResponse {
    private List<RoleResponse> roles;
    private List<JobLevelResponse> levels;
    private List<PermissionResponse> permissions;
    private List<RoleLevelMapping> matrix;
}
