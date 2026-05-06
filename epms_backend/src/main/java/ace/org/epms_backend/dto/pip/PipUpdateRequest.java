package ace.org.epms_backend.dto.pip;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PipUpdateRequest {
    private Long managerId;
    private String reason;
    private String managerPrivateNote;
    private String employeePrivateNote;
}
