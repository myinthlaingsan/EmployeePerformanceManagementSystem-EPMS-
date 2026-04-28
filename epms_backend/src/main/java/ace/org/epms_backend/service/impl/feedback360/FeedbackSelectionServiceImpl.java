package ace.org.epms_backend.service.impl.feedback360;

import ace.org.epms_backend.dto.feedback360.EmployeeEvaluationDTO;
import ace.org.epms_backend.enums.FeedbackRelationship;
import ace.org.epms_backend.enums.FeedbackStatus;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.feedback360.FeedbackRequest;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.AppraisalCycleRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackRequestRepository;
import ace.org.epms_backend.repository.employee.ReportingLineRepository;
import ace.org.epms_backend.repository.employee.EmployeeTeamRepository;
import ace.org.epms_backend.model.employee.EmployeeTeam;
import ace.org.epms_backend.model.employee.ReportingLine;
import ace.org.epms_backend.service.feedback360.FeedbackSelectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackSelectionServiceImpl implements FeedbackSelectionService {

    private final EmployeeRepository employeeRepository;
    private final FeedbackRequestRepository feedbackRequestRepository;
    private final AppraisalCycleRepository appraisalCycleRepository;
    private final ReportingLineRepository reportingLineRepository;
    private final EmployeeTeamRepository teamRepository;

    @Override
    public List<EmployeeEvaluationDTO> suggestEvaluators(Long employeeId) {
        Employee target = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));

        List<EmployeeEvaluationDTO> result = new ArrayList<>();

        // 1. MANAGER
        reportingLineRepository.findByEmployeeAndIsActiveTrue(target)
                .ifPresent(line -> result.add(mapToDTO(line.getManager(), FeedbackRelationship.MANAGER)));

        // 2. PEERS
        List<Employee> allPeers = findPeers(target);
        if (!allPeers.isEmpty()) {
            List<Employee> selectedPeers = selectPeersDynamically(allPeers);
            selectedPeers.forEach(p -> result.add(mapToDTO(p, FeedbackRelationship.PEER)));
        }

        // 3. SUBORDINATES
        List<ReportingLine> subLines = reportingLineRepository.findAllByManagerAndIsActiveTrue(target);
        if (!subLines.isEmpty()) {
            List<Employee> allSubordinates = subLines.stream()
                    .map(ReportingLine::getEmployee)
                    .collect(Collectors.toList());
            List<Employee> selectedSubs = selectSubordinatesDynamically(allSubordinates);
            selectedSubs.forEach(s -> result.add(mapToDTO(s, FeedbackRelationship.SUBORDINATE)));
        }

        // 4. SELF
        result.add(mapToDTO(target, FeedbackRelationship.SELF));

        return result;
    }

    @Override
    @Transactional
    public void confirmEvaluators(Long targetEmployeeId, Long cycleId, List<EmployeeEvaluationDTO> selectedEvaluators) {
        Employee targetEmployee = employeeRepository.findById(targetEmployeeId)
                .orElseThrow(() -> new RuntimeException("Target Employee not found"));

        AppraisalCycle cycle = appraisalCycleRepository.findById(cycleId)
                .orElseThrow(() -> new RuntimeException("Appraisal Cycle not found"));

        for (EmployeeEvaluationDTO dto : selectedEvaluators) {
            Employee evaluator = employeeRepository.findById(dto.getEmployeeId())
                    .orElseThrow(() -> new RuntimeException("Evaluator not found"));

            FeedbackRequest request = FeedbackRequest.builder()
                    .targetUser(targetEmployee)
                    .evaluator(evaluator)
                    .cycle(cycle)
                    .relationship(dto.getRelationship())
                    .status(FeedbackStatus.PENDING)
                    .isAnonymous(true)
                    .build();

            feedbackRequestRepository.save(request);
        }
    }

    private EmployeeEvaluationDTO mapToDTO(Employee emp, FeedbackRelationship rel) {
        return new EmployeeEvaluationDTO(emp.getId(), emp.getStaffName(), rel);
    }

    private List<Employee> findPeers(Employee employee) {
        List<EmployeeTeam> teams = teamRepository.findByEmployeeId(employee.getId());
        if (!teams.isEmpty()) {
            Long primaryTeamId = teams.stream()
                    .filter(EmployeeTeam::getIsPrimary)
                    .findFirst()
                    .orElse(teams.get(0))
                    .getTeam().getTeamId();

            return teamRepository.findByTeamTeamId(primaryTeamId).stream()
                    .map(EmployeeTeam::getEmployee)
                    .filter(e -> !e.getId().equals(employee.getId()))
                    .collect(Collectors.toList());
        }
        return Collections.emptyList();
    }

    private List<Employee> selectPeersDynamically(List<Employee> peers) {
        if (peers.isEmpty()) return new ArrayList<>();
        Collections.shuffle(peers);
        int totalCount = peers.size();
        int limit = (totalCount <= 2) ? totalCount : (totalCount <= 6 ? 3 : 5);
        return peers.stream().limit(limit).collect(Collectors.toList());
    }

    private List<Employee> selectSubordinatesDynamically(List<Employee> subs) {
        if (subs.isEmpty()) return new ArrayList<>();
        Collections.shuffle(subs);
        int limit = Math.min(subs.size(), 2);
        return subs.stream().limit(limit).collect(Collectors.toList());
    }
}