package ace.org.epms_backend.service;

import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.ReportingLine;
import ace.org.epms_backend.repository.employee.ReportingLineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ReportingChainService {

    private final ReportingLineRepository reportingLineRepository;

    /**
     * Returns true if the given manager is the direct OR indirect manager
     * of the given employee (walks UP the reporting chain from employee).
     */
    public boolean isInReportingChain(Employee manager, Employee employee) {
        Set<Long> visited = new HashSet<>();
        Long currentId = employee.getId();

        while (currentId != null) {
            if (!visited.add(currentId)) break; // cycle protection
            Optional<ReportingLine> line =
                    reportingLineRepository.findFirstByEmployee_IdAndIsActiveTrue(currentId);
            if (line.isEmpty()) break;
            Long managerId = line.get().getManager().getId();
            if (managerId.equals(manager.getId())) return true;
            currentId = managerId;
        }
        return false;
    }

    /**
     * Returns the set of ALL employee IDs (at any depth) who are
     * direct or indirect subordinates of the given manager.
     * Uses BFS traversal — safe for any hierarchy depth.
     */
    public Set<Long> getAllSubordinateIds(Long managerId) {
        Set<Long> result = new HashSet<>();
        Queue<Long> queue = new LinkedList<>();
        queue.add(managerId);
        Set<Long> visited = new HashSet<>();

        while (!queue.isEmpty()) {
            Long currentManagerId = queue.poll();
            if (!visited.add(currentManagerId)) continue;

            List<ReportingLine> directReports =
                    reportingLineRepository.findAllByManager_IdAndIsActiveTrue(currentManagerId);

            for (ReportingLine line : directReports) {
                Long subId = line.getEmployee().getId();
                result.add(subId);
                queue.add(subId); // recurse: they may also be managers
            }
        }
        return result;
    }

    /**
     * Returns direct (depth-1) subordinates of the given manager.
     */
    public List<ReportingLine> getDirectReports(Long managerId) {
        return reportingLineRepository.findAllByManager_IdAndIsActiveTrue(managerId);
    }
}
