package ace.org.epms_backend.dto.org;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleLevelPermissionResponse {
    private Long id;
    private Long roleId;
    private String roleName;
    private Long levelId;
    private String levelName;
    private Long permissionId;
    private String permissionName;
}
