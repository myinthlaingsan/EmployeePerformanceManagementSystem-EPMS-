package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.ReportingLine;
import ace.org.epms_backend.repository.EmployeeDepartmentRepository;
import ace.org.epms_backend.repository.employee.EmployeeTeamRepository;
import ace.org.epms_backend.repository.employee.ReportingLineRepository;
import ace.org.epms_backend.service.feedback360.ManagerAssignmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ManagerAssignmentServiceImpl implements ManagerAssignmentService {

    private final ReportingLineRepository reportingLineRepository;
    private final EmployeeDepartmentRepository departmentRepository;
    private final EmployeeTeamRepository teamRepository;

    @Override
    public Optional<Employee> getDirectManager(Employee target) {
        if (target == null) return Optional.empty();

        int targetRank = getLevelRank(target);
        // Level 4 (Senior Manager/Director) and above have no manager feedback
        if (targetRank <= 4) {
            log.info("Manager assignment skipped for employee {} (Rank <= 4)", target.getStaffName());
            return Optional.empty();
        }

        int expectedManagerRank = targetRank - 1;

        // 1. Try to find the manager from active ReportingLine
        Optional<ReportingLine> activeLine = reportingLineRepository.findByEmployeeAndIsActiveTrue(target);
        if (activeLine.isPresent()) {
            Employee manager = activeLine.get().getManager();
            if (manager != null && manager.getStatus() == ace.org.epms_backend.enums.EmployeeStatus.ACTIVE) {
                int managerRank = getLevelRank(manager);
                if (managerRank == expectedManagerRank) {
                    return Optional.of(manager);
                } else {
                    log.warn("ReportingLine manager {} has Rank {}, but expected Rank {} for target {}. Initiating fallback lookup...", 
                            manager.getStaffName(), managerRank, expectedManagerRank, target.getStaffName());
                }
            }
        }

        // 2. Fallback 1: Department-wide lookup (Find employee with expected rank in the same department)
        Optional<Employee> deptFallbackManager = departmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(target.getId())
                .flatMap(ed -> {
                    if (ed.getCurrentDepartment() == null) return Optional.empty();
                    return departmentRepository.findByCurrentDepartmentIdAndIsCurrentTrue(ed.getCurrentDepartment().getId())
                            .stream()
                            .map(ace.org.epms_backend.model.employee.EmployeeDepartment::getEmployee)
                            .filter(e -> e != null 
                                    && getLevelRank(e) == expectedManagerRank 
                                    && e.getStatus() == ace.org.epms_backend.enums.EmployeeStatus.ACTIVE)
                            .findFirst();
                });

        if (deptFallbackManager.isPresent()) {
            log.info("Fallback: Assigned manager {} from same department for target {}", 
                    deptFallbackManager.get().getStaffName(), target.getStaffName());
            return deptFallbackManager;
        }

        // 3. Fallback 2: Team-wide lookup
        Optional<Employee> teamFallbackManager = teamRepository.findFirstByEmployeeIdAndIsPrimaryTrue(target.getId())
                .flatMap(et -> {
                    if (et.getTeam() == null) return Optional.empty();
                    return teamRepository.findByTeamTeamId(et.getTeam().getTeamId())
                            .stream()
                            .map(ace.org.epms_backend.model.employee.EmployeeTeam::getEmployee)
                            .filter(e -> e != null 
                                    && getLevelRank(e) == expectedManagerRank 
                                    && e.getStatus() == ace.org.epms_backend.enums.EmployeeStatus.ACTIVE)
                            .findFirst();
                });

        if (teamFallbackManager.isPresent()) {
            log.info("Fallback: Assigned manager {} from same team for target {}", 
                    teamFallbackManager.get().getStaffName(), target.getStaffName());
            return teamFallbackManager;
        }

        log.warn("No suitable manager found with expected Rank {} for target employee {}", expectedManagerRank, target.getStaffName());
        return Optional.empty();
    }

    private int getLevelRank(Employee e) {
        if (e == null || e.getLevel() == null) return 99;
        return e.getLevel().getLevelRank() != null ? e.getLevel().getLevelRank() : 99;
    }
}
