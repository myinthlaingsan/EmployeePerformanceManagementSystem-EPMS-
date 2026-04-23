package ace.org.epms_backend.dto.continuous;

import ace.org.epms_backend.enums.SourceType;
import lombok.Data;

import java.time.Instant;

@Data
public class PerformanceHistoryResponse {
    private Long historyId;
    private Long employeeId;
    private String employeeName;
    private SourceType sourceType;
    private Long sourceId;
    private String title;
    private String description;
    private Instant createdAt;
}
