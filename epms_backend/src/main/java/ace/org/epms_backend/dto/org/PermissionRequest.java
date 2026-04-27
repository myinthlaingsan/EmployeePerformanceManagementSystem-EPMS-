package ace.org.epms_backend.dto.org;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PermissionRequest {
    @NotBlank(message = "Permission name is required")
    private String permissionName;
}
