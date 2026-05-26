package ace.org.epms_backend.dto.kpi.lifecycle;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiGoalLifecycleCycleResult {
    private Long cycleId;
    private String cycleName;
    private KpiGoalLifecycleAction action;
    private int affectedGoalCount;
    private String message;
}
