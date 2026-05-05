package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditTrailReportDTO {
    private String tableName;
    private String action;
    private String changedBy;
    private String changedAt;
    private String oldValues;
    private String newValues;
}
