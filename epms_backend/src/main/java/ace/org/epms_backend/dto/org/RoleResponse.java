package ace.org.epms_backend.dto.org;

import ace.org.epms_backend.enums.RoleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor  
@AllArgsConstructor
public class RoleResponse {
    private Long roleId;
    private String roleName;
}
