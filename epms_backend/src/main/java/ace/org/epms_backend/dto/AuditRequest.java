package ace.org.epms_backend.dto;

import ace.org.epms_backend.enums.AuditAction;
import ace.org.epms_backend.enums.AuditStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuditRequest {
    private String tableName;
    private Long recordId;
    private AuditAction action;
    private Object oldState;
    private Object newState;
    private AuditStatus status;
    private String ipAddress;
    private String userAgent;
}
