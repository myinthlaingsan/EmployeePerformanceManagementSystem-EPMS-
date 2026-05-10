package ace.org.epms_backend.service.kpi.impl;

import ace.org.epms_backend.dto.kpi.GoalSetResponse;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.KpiMapper;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.ReportingLine;
import ace.org.epms_backend.model.kpi.KpiHistoryLog;
import ace.org.epms_backend.model.kpi.KpiGoals;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.KpiGoalsRepository;
import ace.org.epms_backend.repository.KpiHistoryLogRepository;
import ace.org.epms_backend.repository.employee.ReportingLineRepository;
import ace.org.epms_backend.service.kpi.KpiHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KpiHistoryServiceImpl implements KpiHistoryService {

    private final KpiGoalsRepository goalsRepository;
    private final KpiHistoryLogRepository historyLogRepository;
    private final EmployeeRepository employeeRepository;
    private final ReportingLineRepository reportingLineRepo;
    private final KpiMapper kpiMapper;

    @Override
    @Transactional(readOnly = true)
    public List<GoalSetResponse> getEmployeeKpiHistory(Long employeeId) {
        validateAccess(employeeId);
        
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
        KpiGoals goalSet = goalsRepository.findById(goalSetId)
                .orElseThrow(() -> new NotFoundException("Goal set not found"));
        
        validateAccess(goalSet.getEmployee().getId());
        
        return historyLogRepository.getAuditLogsByGoalSetId(goalSetId);
    }

    private void validateAccess(Long targetEmployeeId) {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        Employee currentUser = employeeRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new NotFoundException("Current user not found"));

        // 1. Own data check
        if (currentUser.getId().equals(targetEmployeeId)) {
            return;
        }

        // 2. HR/Admin check
        boolean isHrOrAdmin = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_HR") || a.getAuthority().equals("ROLE_ADMIN"));
        
        if (isHrOrAdmin) {
            return;
        }

        // 3. Manager check
        Employee targetEmployee = employeeRepository.findById(targetEmployeeId)
                .orElseThrow(() -> new NotFoundException("Target employee not found"));
        
        ReportingLine rl = reportingLineRepo.findByEmployeeAndIsActiveTrue(targetEmployee).orElse(null);
        if (rl != null && rl.getManager() != null && rl.getManager().getId().equals(currentUser.getId())) {
            return;
        }

        throw new SecurityException("You do not have permission to view this performance history.");
    }
}
