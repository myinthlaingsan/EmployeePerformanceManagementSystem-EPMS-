package ace.org.epms_backend.dto.appraisal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppraisalBulkAssignRequest {
    private Long cycleId;
    private List<Long> employeeIds;
    private List<Long> departmentIds; // Optional filter
    private Long formId;
}


