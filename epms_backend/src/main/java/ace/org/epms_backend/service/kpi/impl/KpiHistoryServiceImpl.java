package ace.org.epms_backend.service.kpi.impl;

import ace.org.epms_backend.dto.kpi.GoalSetResponse;
import ace.org.epms_backend.mapper.KpiMapper;
import ace.org.epms_backend.model.kpi.KpiHistoryLog;
import ace.org.epms_backend.model.kpi.KpiGoals;
import ace.org.epms_backend.repository.KpiGoalsRepository;
import ace.org.epms_backend.repository.KpiHistoryLogRepository;
import ace.org.epms_backend.service.kpi.KpiHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KpiHistoryServiceImpl implements KpiHistoryService {

    private final KpiGoalsRepository goalsRepository;
    private final KpiHistoryLogRepository historyLogRepository;
    private final KpiMapper kpiMapper;

    @Override
    @Transactional(readOnly = true)
    public List<GoalSetResponse> getEmployeeKpiHistory(Long employeeId) {
        List<KpiGoals> goals = goalsRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
        return goals.stream()
                .map(goal -> {
                    // Touch items to initialize lazy collection within transaction
                    if (goal.getItems() != null) {
                        goal.getItems().size();
                        // Also touch category for each item
                        goal.getItems().forEach(item -> {
                            if (item.getCategory() != null) item.getCategory().getName();
                        });
                    }
                    return kpiMapper.toGoalSetResponse(goal);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<KpiHistoryLog> getGoalSetAuditTrail(Long goalSetId) {
        return historyLogRepository.getAuditLogsByGoalSetId(goalSetId);
    }
}
