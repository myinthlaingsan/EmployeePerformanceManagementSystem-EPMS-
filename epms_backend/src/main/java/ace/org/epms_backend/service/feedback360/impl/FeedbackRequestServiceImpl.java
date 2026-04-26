package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.feedback360.FeedbackRequestResponse;
import ace.org.epms_backend.enums.FeedbackRelationship;
import ace.org.epms_backend.enums.FeedbackStatus;
import ace.org.epms_backend.mapper.FeedbackMapper;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.feedback360.FeedbackRequest;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.appraisal.AppraisalCycleRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackRequestRepository;
import ace.org.epms_backend.service.feedback360.FeedbackRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class FeedbackRequestServiceImpl implements FeedbackRequestService {

    private final EmployeeRepository employeeRepository;
    private final FeedbackRequestRepository feedbackRequestRepository;
    private final AppraisalCycleRepository appraisalCycleRepository;
    private final FeedbackMapper feedbackMapper;

    private final Random random = new Random();

    @Override
    @Transactional
    public void generate360FeedbackRequests(Long cycleId, int minPeers, int maxPeers, int minSubs, int maxSubs) {
        AppraisalCycle cycle = appraisalCycleRepository.findById(cycleId)
                .orElseThrow(() -> new RuntimeException("Appraisal cycle not found with ID: " + cycleId));

        List<Employee> allEmployees = employeeRepository.findAll();

        for (Employee target : allEmployees) {
            // 1. SELF
            createRequestIfNotExists(cycle, target, target, FeedbackRelationship.SELF, false);

            // 2. MANAGER
            if (target.getDirectManager() != null) {
                createRequestIfNotExists(cycle, target, target.getDirectManager(), FeedbackRelationship.DIRECT_MANAGER, false);
            }

            // 3. PEERS
            if (target.getDirectManager() != null) {
                List<Employee> peers = employeeRepository.findByDirectManagerAndIdNot(target.getDirectManager(), target.getId());
                Collections.shuffle(peers);
                int peerCount = getRandomBetween(minPeers, maxPeers);
                peers.stream()
                        .limit(peerCount)
                        .forEach(peer -> createRequestIfNotExists(cycle, target, peer, FeedbackRelationship.PEER, true));
            }

            // 4. SUBORDINATES
            List<Employee> subs = target.getSubordinates();
            if (subs != null && !subs.isEmpty()) {
                Collections.shuffle(subs);
                int subCount = getRandomBetween(minSubs, maxSubs);
                subs.stream()
                        .limit(subCount)
                        .forEach(sub -> createRequestIfNotExists(cycle, target, sub, FeedbackRelationship.SUBORDINATE, true));
            }
        }
    }

    @Override
    public List<FeedbackRequestResponse> getMyPendingRequests(Long employeeId) {
        return feedbackRequestRepository.findByEvaluatorIdAndStatus(employeeId, FeedbackStatus.PENDING)
                .stream()
                .map(feedbackMapper::toRequestResponse)
                .toList();
    }

    private void createRequestIfNotExists(AppraisalCycle cycle, Employee target, Employee evaluator, FeedbackRelationship relationship, boolean anonymous) {
        if (!feedbackRequestRepository.existsByTargetUserIdAndEvaluatorIdAndCycleCycleId(target.getId(), evaluator.getId(), cycle.getCycleId())) {
            FeedbackRequest request = FeedbackRequest.builder()
                    .cycle(cycle)
                    .targetUser(target)
                    .evaluator(evaluator)
                    .relationship(relationship)
                    .isAnonymous(anonymous)
                    .status(FeedbackStatus.PENDING)
                    .build();
            feedbackRequestRepository.save(request);
        }
    }

    private int getRandomBetween(int min, int max) {
        return random.nextInt(max - min + 1) + min;
    }
}
