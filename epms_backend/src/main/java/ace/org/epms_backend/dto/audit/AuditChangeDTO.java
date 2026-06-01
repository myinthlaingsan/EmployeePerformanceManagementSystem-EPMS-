package ace.org.epms_backend.dto.audit;

import ace.org.epms_backend.enums.AuditAction;
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
public class AuditChangeDTO {
    private Integer sequenceNumber;
    private Long auditId;
    private AuditAction action;
    private Instant changedAt;
    private String changedByName;
    private Map<String, FieldChangeDTO> changes;
}
