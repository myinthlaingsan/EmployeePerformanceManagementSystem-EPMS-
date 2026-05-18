package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.feedback360.ScoringPolicyRequest;
import ace.org.epms_backend.dto.feedback360.ScoringPolicyResponse;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.employee.JobLevel;
import ace.org.epms_backend.model.feedback360.ScoringPolicy;
import ace.org.epms_backend.repository.AppraisalCycleRepository;
import ace.org.epms_backend.repository.JobLevelRepository;
import ace.org.epms_backend.repository.feedback360.ScoringPolicyRepository;
import ace.org.epms_backend.service.feedback360.ScoringPolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScoringPolicyServiceImpl implements ScoringPolicyService {

    private final ScoringPolicyRepository policyRepository;
    private final AppraisalCycleRepository cycleRepository;
    private final JobLevelRepository jobLevelRepository;

    @Override
    public List<ScoringPolicyResponse> getPoliciesByCycle(Long cycleId) {
        AppraisalCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new NotFoundException("Cycle not found: " + cycleId));
        return policyRepository.findAll().stream()
                .filter(p -> p.getCycle().getCycleId().equals(cycleId))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ScoringPolicyResponse upsert(ScoringPolicyRequest req) {
        AppraisalCycle cycle = cycleRepository.findById(req.getCycleId())
                .orElseThrow(() -> new NotFoundException("Cycle not found: " + req.getCycleId()));

        JobLevel jobLevel = null;
        if (req.getJobLevelId() != null) {
            jobLevel = jobLevelRepository.findById(req.getJobLevelId())
                    .orElseThrow(() -> new NotFoundException("JobLevel not found: " + req.getJobLevelId()));
        }

        Optional<ScoringPolicy> existing = (jobLevel != null)
                ? policyRepository.findByCycleAndJobLevel(cycle, jobLevel)
                : policyRepository.findCycleDefault(cycle);

        ScoringPolicy policy = existing.orElse(ScoringPolicy.builder()
                .cycle(cycle)
                .jobLevel(jobLevel)
                .build());

        policy.setManagerWeight(req.getManagerWeight());
        policy.setPeerWeight(req.getPeerWeight());
        policy.setSubordinateWeight(req.getSubordinateWeight());
        policy.setSelfWeight(req.getSelfWeight());
        policy.setIncludeSelfInFinal(req.getIncludeSelfInFinal());
        policy.setSuppressionThreshold(req.getSuppressionThreshold());

        return toResponse(policyRepository.save(policy));
    }

    private ScoringPolicyResponse toResponse(ScoringPolicy p) {
        return ScoringPolicyResponse.builder()
                .id(p.getId())
                .cycleId(p.getCycle().getCycleId())
                .jobLevelId(p.getJobLevel() != null ? p.getJobLevel().getLevelId() : null)
                .jobLevelCode(p.getJobLevel() != null ? p.getJobLevel().getLevelCode() : null)
                .managerWeight(p.getManagerWeight())
                .peerWeight(p.getPeerWeight())
                .subordinateWeight(p.getSubordinateWeight())
                .selfWeight(p.getSelfWeight())
                .includeSelfInFinal(p.getIncludeSelfInFinal())
                .suppressionThreshold(p.getSuppressionThreshold())
                .build();
    }
}
