package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.feedback360.FeedbackRequestResponse;
import ace.org.epms_backend.enums.FeedbackRelationship;
import ace.org.epms_backend.enums.FeedbackStatus;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.FeedbackMapper;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.EmployeeTeam;
import ace.org.epms_backend.model.feedback360.FeedbackRequest;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.AppraisalCycleRepository;
import ace.org.epms_backend.repository.EmployeeDepartmentRepository;
import ace.org.epms_backend.repository.employee.EmployeeTeamRepository;
import ace.org.epms_backend.repository.employee.ReportingLineRepository;
import ace.org.epms_backend.model.employee.ReportingLine;
import ace.org.epms_backend.dto.feedback360.FeedbackRequestGenerateDTO;
import ace.org.epms_backend.repository.feedback360.FeedbackRequestRepository;
import ace.org.epms_backend.service.feedback360.FeedbackRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackRequestServiceImpl implements FeedbackRequestService {

    private final FeedbackRequestRepository requestRepository;
    private final EmployeeRepository employeeRepository;
    private final AppraisalCycleRepository cycleRepository;
    private final EmployeeTeamRepository teamRepository;
    private final EmployeeDepartmentRepository departmentRepository;
    private final ReportingLineRepository reportingLineRepository;
    private final FeedbackMapper feedbackMapper;

    @Override
    @Transactional
    public void generate360FeedbackRequests(Long cycleId, int minPeers, int maxPeers, int minSubs, int maxSubs) {
        AppraisalCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new NotFoundException("Cycle not found"));

        List<Employee> allEmployees = employeeRepository.findAll();

        for (Employee employee : allEmployees) {
            // 1. SELF
            createRequest(cycle, employee, employee, FeedbackRelationship.SELF, false);

            // 2. MANAGER
            reportingLineRepository.findByEmployeeAndIsActiveTrue(employee)
                    .ifPresent(reportingLine -> {
                        createRequest(cycle, employee, reportingLine.getManager(), FeedbackRelationship.MANAGER, false);
                    });

            // 3. PEERS (From Team) - with limits
            List<Employee> peers = findPeers(employee);
            Collections.shuffle(peers);
            int peerCount = Math.min(peers.size(), maxPeers);
            peers.stream().limit(peerCount)
                    .forEach(peer -> createRequest(cycle, employee, peer, FeedbackRelationship.PEER, true));

            // 4. SUBORDINATES - with limits
            List<ReportingLine> subLines = reportingLineRepository.findAllByManagerAndIsActiveTrue(employee);
            if (!subLines.isEmpty()) {
                Collections.shuffle(subLines);
                int subCount = Math.min(subLines.size(), maxSubs);
                subLines.stream().limit(subCount).forEach(line -> createRequest(cycle, employee, line.getEmployee(),
                        FeedbackRelationship.SUBORDINATE, true));
            }
        }
    }

    @Override
    @Transactional
    public void generateRequests(FeedbackRequestGenerateDTO dto) {
        AppraisalCycle cycle = cycleRepository.findById(dto.getCycleId())
                .orElseThrow(() -> new NotFoundException("Cycle not found"));

        for (Long employeeId : dto.getEmployeeIds()) {
            Employee target = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new NotFoundException("Employee not found: " + employeeId));

            // 1. SELF
            createRequest(cycle, target, target, FeedbackRelationship.SELF, false);

            // 2. MANAGER
            reportingLineRepository.findByEmployeeAndIsActiveTrue(target)
                    .ifPresent(reportingLine -> {
                        createRequest(cycle, target, reportingLine.getManager(), FeedbackRelationship.MANAGER, false);
                    });

            // 3. PEERS (TEAM BASED)
            List<Employee> peers = findPeers(target);
            Collections.shuffle(peers);
            peers.stream().limit(dto.getPeerLimit())
                    .forEach(peer -> createRequest(cycle, target, peer, FeedbackRelationship.PEER, true));

            // 4. SUBORDINATES
            if (Boolean.TRUE.equals(dto.getIncludeSubordinates())) {
                List<ReportingLine> subLines = reportingLineRepository.findAllByManagerAndIsActiveTrue(target);
                for (ReportingLine line : subLines) {
                    createRequest(cycle, target, line.getEmployee(), FeedbackRelationship.SUBORDINATE, true);
                }
            }
        }
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

    private void createRequest(AppraisalCycle cycle, Employee target, Employee evaluator, FeedbackRelationship rel,
            boolean anon) {
        if (!requestRepository.existsByTargetUserIdAndEvaluatorIdAndCycleCycleId(target.getId(), evaluator.getId(),
                cycle.getCycleId())) {
            FeedbackRequest request = FeedbackRequest.builder()
                    .targetUser(target)
                    .evaluator(evaluator)
                    .cycle(cycle)
                    .relationship(rel)
                    .isAnonymous(anon)
                    .status(FeedbackStatus.PENDING)
                    .build();
            requestRepository.save(request);
        }
    }

    @Override
    public List<FeedbackRequestResponse> getMyPendingRequests(Long evaluatorId) {
        return requestRepository.findByEvaluatorIdAndStatus(evaluatorId, FeedbackStatus.PENDING).stream()
                .map(feedbackMapper::toRequestResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<FeedbackRequestResponse> getRequestsByEmployee(Long targetEmployeeId, Long cycleId) {
        return requestRepository.findByTargetUserIdAndCycleCycleId(targetEmployeeId, cycleId).stream()
                .map(feedbackMapper::toRequestResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<FeedbackRequestResponse> getRequestsByCycle(Long cycleId) {
        return requestRepository.findByCycleCycleId(cycleId).stream()
                .map(feedbackMapper::toRequestResponse)
                .collect(Collectors.toList());
    }

    @Override
    public FeedbackRequestResponse getRequest(Long requestId) {
        return requestRepository.findById(requestId)
                .map(feedbackMapper::toRequestResponse)
                .orElseThrow(() -> new NotFoundException("Request not found"));
    }

    @Override
    @Transactional
    public void updateRequestStatus(Long requestId, FeedbackStatus status) {
        FeedbackRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Request not found"));
        request.setStatus(status);
        requestRepository.save(request);
    }

    @Override
    @Transactional
    public void deleteRequest(Long requestId) {
        requestRepository.deleteById(requestId);
    }
}
