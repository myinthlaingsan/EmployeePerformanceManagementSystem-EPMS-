package ace.org.epms_backend.dto.audit;

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
public class AuditSummaryDTO {
    private Long totalChanges;
    private Long createdCount;
    private Long updatedCount;
    private Long deletedCount;
    private Long accessedCount;
    private Map<String, Long> changesByTable;
    private Map<String, Long> changesByUser;
    private Instant oldestChange;
    private Instant latestChange;
}
