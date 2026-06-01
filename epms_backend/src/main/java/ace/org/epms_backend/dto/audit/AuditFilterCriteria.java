package ace.org.epms_backend.dto.audit;

import ace.org.epms_backend.enums.AuditAction;
import ace.org.epms_backend.enums.AuditStatus;
import ace.org.epms_backend.enums.SortDirection;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditFilterCriteria {
    private String tableName;
    private Long recordId;
    private Long changedByUserId;
    private AuditAction action;
    private AuditStatus status;
    private LocalDateRange dateRange;
    private Integer pageNumber;
    private Integer pageSize;
    private String sortBy;
    private SortDirection sortDirection;
    private Boolean includeJsonPayload;
}
