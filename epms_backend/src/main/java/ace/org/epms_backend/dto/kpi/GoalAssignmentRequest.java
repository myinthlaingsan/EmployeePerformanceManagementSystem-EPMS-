package ace.org.epms_backend.dto.kpi;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GoalAssignmentRequest {
    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    private Long libraryId;

    @NotNull(message = "Appraisal Cycle ID is required")
    private Long appraisalCycleId;

    private boolean overwriteExisting;
}
