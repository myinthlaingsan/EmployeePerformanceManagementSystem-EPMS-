package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.appraisal.AppraisalCycleRequest;
import ace.org.epms_backend.dto.appraisal.AppraisalCycleResponse;
import ace.org.epms_backend.enums.CycleStatus;
import ace.org.epms_backend.exception.ResourceNotFoundException;
import ace.org.epms_backend.mapper.AppraisalCycleMapper;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.repository.AppraisalCycleRepository;
import ace.org.epms_backend.repository.AppraisalRepository;
import ace.org.epms_backend.repository.appraisal.FinancialYearRepository;
import ace.org.epms_backend.repository.ScoringWeightRepository;
import ace.org.epms_backend.service.AppraisalCycleService;
import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;
import lombok.RequiredArgsConstructor;
import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.enums.AuditAction;
import ace.org.epms_backend.enums.AuditStatus;
import ace.org.epms_backend.service.AuditService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AppraisalCycleServiceImpl implements AppraisalCycleService {

    private final AppraisalCycleRepository appraisalCycleRepository;
    private final FinancialYearRepository financialYearRepository;
    private final ScoringWeightRepository scoringWeightRepository;
    private final AppraisalCycleMapper appraisalCycleMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final AuditService auditService;
    private final AppraisalRepository appraisalRepository;

    @Override
    @Transactional
    public AppraisalCycleResponse create(AppraisalCycleRequest request) {
        if (Boolean.TRUE.equals(request.getIsActive())) {
            deactivateCurrentActiveCycles();
        }

        AppraisalCycle cycle = appraisalCycleMapper.toEntity(request);
        
        if (request.getFinancialYearId() != null) {
            ace.org.epms_backend.model.appraisal.FinancialYear financialYear = financialYearRepository.findById(request.getFinancialYearId())
                    .orElseThrow(() -> new ResourceNotFoundException("FinancialYear not found with id: " + request.getFinancialYearId()));
            cycle.setFinancialYear(financialYear);
        }

        cycle = appraisalCycleRepository.save(cycle);

        // Save Scoring Weights (use upsert to handle potential orphan rows from manual DB clears)
        ace.org.epms_backend.model.appraisal.ScoringWeight weights = scoringWeightRepository.findByCycle_CycleId(cycle.getCycleId())
                .orElse(new ace.org.epms_backend.model.appraisal.ScoringWeight());
        weights.setCycle(cycle);
        weights.setKpiWeight(request.getKpiWeight());
        weights.setManagerWeight(request.getManagerWeight());
        weights.setSelfWeight(request.getSelfWeight());
        weights.setFeedbackWeight(request.getFeedbackWeight());
        scoringWeightRepository.save(weights);

        // Log Audit
        auditService.log(AuditRequest.builder()
                .tableName("appraisal_cycle")
                .recordId(cycle.getCycleId())
                .action(AuditAction.INSERT)
                .newState(cycle)
                .status(AuditStatus.SUCCESS)
                .build());

        AppraisalCycleResponse response = appraisalCycleMapper.toResponse(cycle);
        mapWeightsToResponse(weights, response);
        return response;
    }

    @Override
    public List<AppraisalCycleResponse> getAll() {
        List<AppraisalCycle> cycles = appraisalCycleRepository.findAll();
        return cycles.stream().map(cycle -> {
            AppraisalCycleResponse resp = appraisalCycleMapper.toResponse(cycle);
            scoringWeightRepository.findByCycle_CycleId(cycle.getCycleId())
                    .ifPresent(w -> mapWeightsToResponse(w, resp));
            return resp;
        }).toList();
    }

    @Override
    public AppraisalCycleResponse getById(Long id) {
        AppraisalCycle cycle = getCycleById(id);
        AppraisalCycleResponse resp = appraisalCycleMapper.toResponse(cycle);
        scoringWeightRepository.findByCycle_CycleId(cycle.getCycleId())
                .ifPresent(w -> mapWeightsToResponse(w, resp));
        return resp;
    }

    @Override
    @Transactional
    public AppraisalCycleResponse update(Long id, AppraisalCycleRequest request) {
        AppraisalCycle cycle = getCycleById(id);

        if (Boolean.TRUE.equals(request.getIsActive()) && !Boolean.TRUE.equals(cycle.getIsActive())) {
            deactivateCurrentActiveCycles();
        }

        appraisalCycleMapper.updateEntityFromRequest(request, cycle);
        
        if (request.getFinancialYearId() != null) {
            ace.org.epms_backend.model.appraisal.FinancialYear financialYear = financialYearRepository.findById(request.getFinancialYearId())
                    .orElseThrow(() -> new ResourceNotFoundException("FinancialYear not found with id: " + request.getFinancialYearId()));
            cycle.setFinancialYear(financialYear);
        }
        
        cycle = appraisalCycleRepository.save(cycle);

        // Update Weights
        ace.org.epms_backend.model.appraisal.ScoringWeight weights = scoringWeightRepository.findByCycle_CycleId(id)
                .orElse(new ace.org.epms_backend.model.appraisal.ScoringWeight());
        weights.setCycle(cycle);
        weights.setKpiWeight(request.getKpiWeight());
        weights.setManagerWeight(request.getManagerWeight());
        weights.setSelfWeight(request.getSelfWeight());
        weights.setFeedbackWeight(request.getFeedbackWeight());
        scoringWeightRepository.save(weights);

        // Log Audit
        auditService.log(AuditRequest.builder()
                .tableName("appraisal_cycle")
                .recordId(cycle.getCycleId())
                .action(AuditAction.UPDATE)
                .newState(cycle)
                .status(AuditStatus.SUCCESS)
                .build());

        AppraisalCycleResponse response = appraisalCycleMapper.toResponse(cycle);
        mapWeightsToResponse(weights, response);
        return response;
    }

    private void mapWeightsToResponse(ace.org.epms_backend.model.appraisal.ScoringWeight weights,
            AppraisalCycleResponse response) {
        response.setKpiWeight(weights.getKpiWeight());
        response.setManagerWeight(weights.getManagerWeight());
        response.setSelfWeight(weights.getSelfWeight());
        response.setFeedbackWeight(weights.getFeedbackWeight());
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!appraisalCycleRepository.existsById(id)) {
            throw new ResourceNotFoundException("AppraisalCycle not found with id: " + id);
        }

        // Check if cycle has any appraisals assigned
        if (!appraisalRepository.findByCycle_CycleId(id).isEmpty()) {
            throw new RuntimeException(
                    "Cannot delete cycle. It has active appraisals assigned. Please close or archive it instead.");
        }

        appraisalCycleRepository.deleteById(id);
    }

    @Override
    @Transactional
    public AppraisalCycleResponse activate(Long id) {
        AppraisalCycle cycle = getCycleById(id);

        deactivateCurrentActiveCycles();

        cycle.setIsActive(true);
        if (cycle.getStatus() == null || cycle.getStatus() == CycleStatus.ARCHIVED) {
            cycle.setStatus(CycleStatus.PLANNING);
        }
        cycle = appraisalCycleRepository.save(cycle);

        // Trigger Broadcast Notification
        eventPublisher.publishEvent(NotificationEvent.builder()
                .broadcast(true)
                .type(NotificationType.APPRAISAL_CYCLE_OPENED)
                .title("Appraisal Cycle Opened")
                .message("The appraisal cycle '" + cycle.getCycleName()
                        + "' is now open. You can start your self-assessments.")
                .referenceType(ReferenceType.APPRAISAL)
                .referenceId(cycle.getCycleId())
                .actionUrl("/appraisals/my-appraisals")
                .build());

        cycle = appraisalCycleRepository.save(cycle);

        // Log Audit
        auditService.log(AuditRequest.builder()
                .tableName("appraisal_cycle")
                .recordId(cycle.getCycleId())
                .action(AuditAction.UPDATE)
                .newState(cycle)
                .status(AuditStatus.SUCCESS)
                .build());

        return appraisalCycleMapper.toResponse(cycle);
    }

    @Override
    @Transactional
    public AppraisalCycleResponse close(Long id) {
        AppraisalCycle cycle = getCycleById(id);
        cycle.setIsActive(false);
        cycle.setStatus(CycleStatus.ARCHIVED);
        cycle = appraisalCycleRepository.save(cycle);

        // Trigger Broadcast Notification
        eventPublisher.publishEvent(NotificationEvent.builder()
                .broadcast(true)
                .type(NotificationType.APPRAISAL_CYCLE_CLOSED)
                .title("Appraisal Cycle Closed")
                .message("The appraisal cycle '" + cycle.getCycleName() + "' has been closed.")
                .referenceType(ReferenceType.APPRAISAL)
                .referenceId(cycle.getCycleId())
                .actionUrl("/appraisals/history")
                .build());

        cycle = appraisalCycleRepository.save(cycle);

        // Log Audit
        auditService.log(AuditRequest.builder()
                .tableName("appraisal_cycle")
                .recordId(cycle.getCycleId())
                .action(AuditAction.UPDATE)
                .newState(cycle)
                .status(AuditStatus.SUCCESS)
                .build());

        return appraisalCycleMapper.toResponse(cycle);
    }

    @Override
    public AppraisalCycleResponse getActiveCycle() {
        List<AppraisalCycle> cycles = appraisalCycleRepository.findActiveCyclesByStatus(List.of(CycleStatus.PLANNING, CycleStatus.IN_PROGRESS));
        
        // Fallback: If status-specific search fails, return the first active cycle regardless of status
        if (cycles.isEmpty()) {
            cycles = appraisalCycleRepository.findByIsActiveTrue();
        }

        return cycles.stream()
                .findFirst()
                .map(appraisalCycleMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("No active appraisal cycle found"));
    }

    private AppraisalCycle getCycleById(Long id) {
        return appraisalCycleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AppraisalCycle not found with id: " + id));
    }

    private void deactivateCurrentActiveCycles() {
        List<AppraisalCycle> activeCycles = appraisalCycleRepository.findByIsActiveTrue();
        for (AppraisalCycle c : activeCycles) {
            c.setIsActive(false);
        }
        if (!activeCycles.isEmpty()) {
            appraisalCycleRepository.saveAll(activeCycles);
        }
    }
}
