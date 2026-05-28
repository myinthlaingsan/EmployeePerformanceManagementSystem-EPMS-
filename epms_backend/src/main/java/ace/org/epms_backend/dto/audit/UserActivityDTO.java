package ace.org.epms_backend.dto.audit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserActivityDTO {
    private Long auditId;
    private Instant changedAt;
    private String action;
    private String tableName;
    private Long recordId;
    private String summary;
    private String status;
}
