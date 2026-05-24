package ace.org.epms_backend.dto.kpi;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class BulkGoalAssignmentRequest {
    @NotEmpty(message = "Employee IDs list cannot be empty")
    private List<Long> employeeIds;

    @NotNull(message = "Library ID is required")
    private Long libraryId;

    @NotNull(message = "Appraisal Cycle ID is required")
    private Long appraisalCycleId;

    private boolean overwriteExisting;
}
