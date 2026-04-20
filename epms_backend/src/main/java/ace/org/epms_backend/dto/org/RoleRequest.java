package ace.org.epms_backend.dto.org;

import ace.org.epms_backend.enums.RoleType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleRequest {
    @NotNull(message = "Role name is required")
    private RoleType roleName;
}