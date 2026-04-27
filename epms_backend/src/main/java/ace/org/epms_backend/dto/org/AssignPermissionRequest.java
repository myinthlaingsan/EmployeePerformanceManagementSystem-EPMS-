package ace.org.epms_backend.dto.org;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignPermissionRequest {
    @NotNull(message = "Role ID is required")
    private Long roleId;

    @NotNull(message = "Level ID is required")
    private Long levelId;

    @NotNull(message = "Permission ID is required")
    private Long permissionId;
}
