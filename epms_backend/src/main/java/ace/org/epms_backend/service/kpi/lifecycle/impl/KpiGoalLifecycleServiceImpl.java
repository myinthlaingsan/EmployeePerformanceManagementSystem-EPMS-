package ace.org.epms_backend.service.kpi.lifecycle.impl;

import ace.org.epms_backend.dto.kpi.lifecycle.KpiGoalLifecycleAction;
import ace.org.epms_backend.dto.kpi.lifecycle.KpiGoalLifecycleCycleResult;
import ace.org.epms_backend.dto.kpi.lifecycle.KpiGoalLifecycleRunResult;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.repository.kpi.KpiGoalLifecycleRepository;
import ace.org.epms_backend.service.kpi.lifecycle.KpiGoalLifecycleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KpiGoalLifecycleServiceImpl implements KpiGoalLifecycleService {

    private final KpiGoalLifecycleRepository lifecycleRepository;

    @Override
    @Transactional
    public int lockGoalsForDueManagerEvaluationCycles(LocalDate today) {
        return lifecycleRepository.findCyclesDueForLock(today).stream()
                .mapToInt(cycle -> lifecycleRepository.lockNonArchivedGoalsByCycleId(cycle.getCycleId()))
                .sum();
    }

    @Override
    @Transactional
    public int archiveGoalsForDueFinalizationCycles(LocalDate today) {
        return lifecycleRepository.findCyclesDueForArchive(today).stream()
                .mapToInt(cycle -> lifecycleRepository.archiveLockedGoalsByCycleId(cycle.getCycleId()))
                .sum();
    }

    @Override
    @Transactional
    public KpiGoalLifecycleRunResult runLifecycle(LocalDate today) {
        List<KpiGoalLifecycleCycleResult> results = new ArrayList<>();
        int lockedGoalCount = 0;
        int archivedGoalCount = 0;

        for (AppraisalCycle cycle : lifecycleRepository.findCyclesDueForLock(today)) {
            int affected = lifecycleRepository.lockNonArchivedGoalsByCycleId(cycle.getCycleId());
            lockedGoalCount += affected;
            results.add(result(cycle, KpiGoalLifecycleAction.LOCK, affected));
        }

        for (AppraisalCycle cycle : lifecycleRepository.findCyclesDueForArchive(today)) {
            int affected = lifecycleRepository.archiveLockedGoalsByCycleId(cycle.getCycleId());
            archivedGoalCount += affected;
            results.add(result(cycle, KpiGoalLifecycleAction.ARCHIVE, affected));
        }

        return KpiGoalLifecycleRunResult.builder()
                .runDate(today)
                .lockedGoalCount(lockedGoalCount)
                .archivedGoalCount(archivedGoalCount)
                .cycleResults(results)
                .build();
    }

    private KpiGoalLifecycleCycleResult result(
            AppraisalCycle cycle,
            KpiGoalLifecycleAction action,
            int affectedGoalCount) {
        return KpiGoalLifecycleCycleResult.builder()
                .cycleId(cycle.getCycleId())
                .cycleName(cycle.getCycleName())
                .action(action)
                .affectedGoalCount(affectedGoalCount)
                .message(action == KpiGoalLifecycleAction.LOCK
                        ? "KPI goals locked for manager evaluation deadline"
                        : "Locked KPI goals archived for finalization deadline")
                .build();
    }
}
