package ace.org.epms_backend.dto.continuous;

import ace.org.epms_backend.enums.SourceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceHistoryResponse {
    private Long historyId;
    private Long employeeId;
    private String employeeName;
    private SourceType sourceType;
    private Long sourceId;
    private Long managerId;
    private String managerName;
    private String title;
    private String description;
    private Boolean isPrivate;
    private Long performerId;
    private String performerName;
    private Instant createdAt;
}
