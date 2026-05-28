package ace.org.epms_backend.dto.audit;

import ace.org.epms_backend.dto.employee.EmployeeResponse;
import ace.org.epms_backend.enums.AuditAction;
import ace.org.epms_backend.enums.AuditStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDetailDTO {
    private Long auditId;
    private String tableName;
    private Long recordId;
    private AuditAction action;
    private EmployeeResponse changedBy;
    private String changedByName;
    private Instant changedAt;
    private String ipAddress;
    private String userAgent;
    private AuditStatus status;
    private Map<String, FieldChangeDTO> fieldChanges;
}
