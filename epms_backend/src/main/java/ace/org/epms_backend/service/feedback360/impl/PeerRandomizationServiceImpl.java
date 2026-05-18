package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.repository.EmployeeDepartmentRepository;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.employee.EmployeeTeamRepository;
import ace.org.epms_backend.service.feedback360.ManagerAssignmentService;
import ace.org.epms_backend.service.feedback360.PeerRandomizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PeerRandomizationServiceImpl implements PeerRandomizationService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeDepartmentRepository departmentRepository;
    private final EmployeeTeamRepository teamRepository;
    private final ManagerAssignmentService managerAssignmentService;

    @Override
    public List<Employee> selectPeers(Employee target, int maxPeers, Set<Long> excludedEvaluatorIds) {
        if (target == null || maxPeers <= 0) return Collections.emptyList();

        int rank = getLevelRank(target);

        // 1. Resolve initial peer pool based on level-specific scopes
        List<Employee> peerPool;
        if (rank == 4) {
            peerPool = findPeersGlobal(target);
        } else if (rank == 7) {
            peerPool = findPeersHybrid(target, maxPeers);
        } else {
            peerPool = findPeersByDepartment(target);
        }

        // 2. Strict exclusions: Exclude self, direct manager, and inactive employees
        Optional<Employee> directManager = managerAssignmentService.getDirectManager(target);
        Set<Long> strictExclusions = new HashSet<>();
        strictExclusions.add(target.getId());
        directManager.ifPresent(m -> strictExclusions.add(m.getId()));

        List<Employee> filteredPool = peerPool.stream()
                .filter(p -> p != null 
                        && !strictExclusions.contains(p.getId()) 
                        && p.getStatus() == ace.org.epms_backend.enums.EmployeeStatus.ACTIVE)
                .collect(Collectors.toList());

        // 3. Anti-fatigue rotation: Prioritize peers who didn't evaluate this person in the previous cycle
        List<Employee> rotatedPeers = filteredPool.stream()
                .filter(p -> !excludedEvaluatorIds.contains(p.getId()))
                .collect(Collectors.toList());

        // Fallback: If not enough non-fatigued peers, add back previous evaluators to meet the quota
        if (rotatedPeers.size() < maxPeers) {
            for (Employee p : filteredPool) {
                if (!rotatedPeers.contains(p)) {
                    rotatedPeers.add(p);
                }
            }
        }

        // 4. Randomization: Shuffle the candidate peers
        Collections.shuffle(rotatedPeers);

        return rotatedPeers;
    }

    private List<Employee> findPeersGlobal(Employee target) {
        int rank = getLevelRank(target);
        return employeeRepository.findAll().stream()
                .filter(e -> !e.getId().equals(target.getId()) 
                        && getLevelRank(e) == rank 
                        && e.getStatus() == ace.org.epms_backend.enums.EmployeeStatus.ACTIVE)
                .collect(Collectors.toList());
    }

    private List<Employee> findPeersByDepartment(Employee employee) {
        return departmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(employee.getId()).map(ed -> {
            if (ed.getCurrentDepartment() == null) return new ArrayList<Employee>();
            int rank = getLevelRank(employee);
            return departmentRepository.findByCurrentDepartmentIdAndIsCurrentTrue(ed.getCurrentDepartment().getId()).stream()
                    .map(ace.org.epms_backend.model.employee.EmployeeDepartment::getEmployee)
                    .filter(e -> e != null 
                            && !e.getId().equals(employee.getId()) 
                            && getLevelRank(e) == rank 
                            && e.getStatus() == ace.org.epms_backend.enums.EmployeeStatus.ACTIVE)
                    .collect(Collectors.toList());
        }).orElse(Collections.emptyList());
    }

    private List<Employee> findPeersByTeam(Employee target) {
        List<Employee> peers = new ArrayList<>();
        int rank = getLevelRank(target);
        teamRepository.findByEmployeeIdAndIsPrimaryTrue(target.getId()).ifPresent(et -> {
            if (et.getTeam() != null) {
                peers.addAll(teamRepository.findByTeamTeamId(et.getTeam().getTeamId()).stream()
                        .map(ace.org.epms_backend.model.employee.EmployeeTeam::getEmployee)
                        .filter(e -> e != null 
                                && !e.getId().equals(target.getId()) 
                                && getLevelRank(e) == rank 
                                && e.getStatus() == ace.org.epms_backend.enums.EmployeeStatus.ACTIVE)
                        .collect(Collectors.toList()));
            }
        });
        return peers;
    }

    private List<Employee> findPeersHybrid(Employee target, int maxPeers) {
        List<Employee> pool = findPeersByTeam(target);
        if (pool.size() < maxPeers) {
            findPeersByDepartment(target).forEach(p -> {
                if (!pool.contains(p)) pool.add(p);
            });
        }
        return pool;
    }

    private int getLevelRank(Employee e) {
        if (e == null || e.getLevel() == null) return 99;
        return e.getLevel().getLevelRank() != null ? e.getLevel().getLevelRank() : 99;
    }
}
