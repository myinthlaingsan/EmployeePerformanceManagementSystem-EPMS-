package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.feedback360.EmployeeEvaluationDTO;
import ace.org.epms_backend.enums.FeedbackRelationship;
import ace.org.epms_backend.enums.FeedbackStatus;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.feedback360.FeedbackRequest;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.AppraisalCycleRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackRequestRepository;
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

    @Override
    public List<EmployeeEvaluationDTO> suggestEvaluators(Long employeeId) {
        Employee target = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));

        List<EmployeeEvaluationDTO> result = new ArrayList<>();

        // 1. MANAGER
        if (target.getDirectManager() != null) {
            result.add(mapToDTO(target.getDirectManager(), FeedbackRelationship.MANAGER));
        }

        // 2. PEERS
        if (target.getDirectManager() != null) {
            List<Employee> allPeers = employeeRepository.findByDirectManagerAndIdNot(target.getDirectManager(), target.getId());
            List<Employee> selectedPeers = selectPeersDynamically(allPeers);
            selectedPeers.forEach(p -> result.add(mapToDTO(p, FeedbackRelationship.PEER)));
        }

        // 3. SUBORDINATES
        List<Employee> allSubordinates = target.getSubordinates();
        if (allSubordinates != null && !allSubordinates.isEmpty()) {
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