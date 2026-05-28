package ace.org.epms_backend.service.kpi.lifecycle;

import ace.org.epms_backend.dto.kpi.lifecycle.KpiGoalLifecycleRunResult;

import java.time.LocalDate;

public interface KpiGoalLifecycleService {
    int lockGoalsForDueManagerEvaluationCycles(LocalDate today);

    int archiveGoalsForDueFinalizationCycles(LocalDate today);

    KpiGoalLifecycleRunResult runLifecycle(LocalDate today);
}
