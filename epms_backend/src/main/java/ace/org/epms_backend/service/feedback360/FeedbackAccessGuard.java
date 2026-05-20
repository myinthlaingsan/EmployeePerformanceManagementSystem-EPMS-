package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.employee.ReportingLineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FeedbackAccessGuard {

    private final EmployeeRepository employeeRepository;
    private final ReportingLineRepository reportingLineRepository;

    /**
     * Returns true if viewerId may see the summarized feedback report for targetId.
     * Allowed: the employee themselves, their direct manager, and HR/admin.
     */
    public boolean canViewSummary(Long viewerId, Long targetId) {
        if (viewerId.equals(targetId)) return true;
        if (isHR(viewerId)) return true;
        if (isManagerOf(viewerId, targetId)) return true;
        return false;
    }

    /**
     * Returns true if viewerId may see the raw feedback responses for a given feedback entry.
     * Only HR/admin or the evaluator who submitted the feedback may view raw responses.
     */
    public boolean canViewRawFeedback(Long viewerId, Long evaluatorId) {
        return viewerId.equals(evaluatorId) || isHR(viewerId);
    }

    private boolean isHR(Long viewerId) {
        return employeeRepository.findById(viewerId)
                .map(e -> e.getLevel() != null
                        && e.getLevel().getLevelCode() != null
                        && (e.getLevel().getLevelCode().equalsIgnoreCase("HR")
                            || e.getLevel().getLevelRank() != null
                            && e.getLevel().getLevelRank() <= 2))
                .orElse(false);
    }

    private boolean isManagerOf(Long managerId, Long subordinateId) {
        return employeeRepository.findById(subordinateId)
                .flatMap(sub -> reportingLineRepository.findByEmployeeAndIsActiveTrue(sub))
                .map(line -> line.getManager() != null && line.getManager().getId().equals(managerId))
                .orElse(false);
    }
}
