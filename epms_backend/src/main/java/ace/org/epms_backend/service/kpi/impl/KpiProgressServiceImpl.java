package ace.org.epms_backend.service.kpi.impl;

import ace.org.epms_backend.dto.kpi.GoalSetResponse;
import ace.org.epms_backend.dto.kpi.KpiProgressResponse;
import ace.org.epms_backend.dto.kpi.ProgressRequest;
import ace.org.epms_backend.enums.KpiGoalStatus;
import ace.org.epms_backend.enums.KpiItemStatus;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.KpiMapper;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.kpi.KpiGoalItem;
import ace.org.epms_backend.model.kpi.KpiProgress;
import ace.org.epms_backend.model.kpi.KpiHistoryLog;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.KpiGoalItemRepository;
import ace.org.epms_backend.repository.KpiHistoryLogRepository;
import ace.org.epms_backend.repository.KpiProgressRepository;
import ace.org.epms_backend.service.kpi.KpiHistoryService;
import ace.org.epms_backend.service.kpi.KpiProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KpiProgressServiceImpl implements KpiProgressService {

    private final KpiGoalItemRepository goalItemRepository;
    private final KpiProgressRepository progressRepository;
    private final EmployeeRepository employeeRepository;
    private final KpiHistoryLogRepository historyRepo;
    private final KpiMapper kpiMapper;

    @Override
    @Transactional
    public GoalSetResponse updateProgress(ProgressRequest request) {
        KpiGoalItem item = goalItemRepository.findById(request.getGoalItemId())
                .orElseThrow(() -> new NotFoundException("Goal item not found"));

        if (!item.getGoalSet().getStatus().equals(KpiGoalStatus.APPROVED)) {
            throw new IllegalStateException("Cannot update progress for non-approved goals");
        }

        Employee currentUser = getCurrentEmployee();
        if (!item.getGoalSet().getEmployee().getId().equals(currentUser.getId())) {
            throw new SecurityException("Only the employee can update their own progress");
        }

        KpiProgress progress = kpiMapper.toProgressEntity(request);
        progress.setGoalItem(item);
        progress.setUpdatedBy(currentUser.getId());
        progressRepository.save(progress);

        // Update item status and snapshot value
        item.setActualValue(request.getActualValue());
        if (request.getProgressPercent().compareTo(new BigDecimal("100")) >= 0) {
            item.setStatus(KpiItemStatus.COMPLETED);
        } else {
            item.setStatus(KpiItemStatus.IN_PROGRESS);
        }
        goalItemRepository.save(item);

        // Add to history audit trail
        historyRepo.save(KpiHistoryLog.builder()
                .employeeId(item.getGoalSet().getEmployee().getId())
                .goalSetId(item.getGoalSet().getId())
                .itemId(item.getId())
                .action("PROGRESS_UPDATE")
                .changeDetails(String.format("Updated progress for '%s': %s %s (%s%%)", 
                    item.getTitle(), request.getActualValue(), item.getUnit(), request.getProgressPercent()))
                .changeReason(request.getEvidenceNote())
                .changedBy(currentUser.getId())
                .build());

        return kpiMapper.toGoalSetResponse(item.getGoalSet());
    }

    @Override
    public List<KpiProgressResponse> getRecentProgress(Long employeeId, int limit) {
        return progressRepository.findByGoalItemGoalSetEmployeeIdOrderByIdDesc(employeeId).stream()
                .limit(limit)
                .map(p -> KpiProgressResponse.builder()
                        .id(p.getId())
                        .goalItemId(p.getGoalItem().getId())
                        .goalTitle(p.getGoalItem().getTitle())
                        .actualValue(p.getActualValue())
                        .progressPercent(p.getProgressPercent())
                        .evidenceNote(p.getEvidenceNote())
                        .updatedAt(p.getCreatedAt().toString())
                        .build())
                .collect(Collectors.toList());
    }

    private Employee getCurrentEmployee() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return employeeRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Current user not found"));
    }
}
