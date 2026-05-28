package ace.org.epms_backend.dto.audit;

import ace.org.epms_backend.enums.AuditAction;
import ace.org.epms_backend.enums.AuditStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDTO {
    private Long auditId;
    private String tableName;
    private Long recordId;
    private AuditAction action;
    private String changedByName;
    private Instant changedAt;
    private String ipAddress;
    private AuditStatus status;
}
