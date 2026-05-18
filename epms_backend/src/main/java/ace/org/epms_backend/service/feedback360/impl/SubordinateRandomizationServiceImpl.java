package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.ReportingLine;
import ace.org.epms_backend.repository.employee.ReportingLineRepository;
import ace.org.epms_backend.service.feedback360.SubordinateRandomizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubordinateRandomizationServiceImpl implements SubordinateRandomizationService {

    private final ReportingLineRepository reportingLineRepository;

    @Override
    public List<Employee> selectSubordinates(Employee target, int maxSubordinates, Set<Long> excludedEvaluatorIds) {
        if (target == null || maxSubordinates <= 0) return Collections.emptyList();

        // 1. Skip subordinate logic if Job Level contains "Junior"
        boolean isJunior = target.getLevel() != null 
                && target.getLevel().getLevelName() != null 
                && target.getLevel().getLevelName().toLowerCase().contains("junior");
        if (isJunior) {
            log.info("Subordinate assignment skipped for Junior staff member {}", target.getStaffName());
            return Collections.emptyList();
        }

        // 2. Select subordinates directly from active ReportingLine records where target is their manager
        List<Employee> subPool = reportingLineRepository.findAllByManagerAndIsActiveTrue(target)
                .stream()
                .map(ReportingLine::getEmployee)
                .filter(e -> e != null && e.getStatus() == ace.org.epms_backend.enums.EmployeeStatus.ACTIVE)
                .collect(Collectors.toList());

        // 3. Anti-fatigue rotation: Exclude previous cycle evaluators
        List<Employee> rotatedSubs = subPool.stream()
                .filter(s -> !excludedEvaluatorIds.contains(s.getId()))
                .collect(Collectors.toList());

        // Fallback: If not enough non-fatigued subordinates, add back previous evaluators
        if (rotatedSubs.size() < maxSubordinates) {
            for (Employee s : subPool) {
                if (!rotatedSubs.contains(s)) {
                    rotatedSubs.add(s);
                }
            }
        }

        // 4. Randomization: Shuffle the candidates
        Collections.shuffle(rotatedSubs);

        return rotatedSubs;
    }
}
