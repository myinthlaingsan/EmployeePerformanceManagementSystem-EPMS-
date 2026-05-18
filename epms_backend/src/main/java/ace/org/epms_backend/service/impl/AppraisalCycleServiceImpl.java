package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.appraisal.AppraisalCycleRequest;
import ace.org.epms_backend.dto.appraisal.AppraisalCycleResponse;
import ace.org.epms_backend.enums.AppraisalStatus;
import ace.org.epms_backend.enums.CycleStatus;
import ace.org.epms_backend.exception.ResourceNotFoundException;
import ace.org.epms_backend.mapper.AppraisalCycleMapper;
import ace.org.epms_backend.model.appraisal.Appraisal;
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
    private final ace.org.epms_backend.repository.appraisal.AppraisalFormSetRepository appraisalFormSetRepository;
    private final ace.org.epms_backend.service.AppraisalFormService appraisalFormService;

    @Override
    @Transactional
    public AppraisalCycleResponse create(AppraisalCycleRequest request) {
        if (Boolean.TRUE.equals(request.getIsActive())) {
            checkForActiveCycles(null);
        }
        validateNoDateOverlap(request.getStartDate(), request.getEndDate(), null);

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
        response.setIsAssigned(false);
        return response;
    }

    @Override
    public List<AppraisalCycleResponse> getAll() {
        List<AppraisalCycle> cycles = appraisalCycleRepository.findAll();
        return cycles.stream().map(cycle -> {
            AppraisalCycleResponse resp = appraisalCycleMapper.toResponse(cycle);
            scoringWeightRepository.findByCycle_CycleId(cycle.getCycleId())
                    .ifPresent(w -> mapWeightsToResponse(w, resp));
            resp.setIsAssigned(!appraisalRepository.findByCycle_CycleId(cycle.getCycleId()).isEmpty());
            return resp;
        }).toList();
    }

    @Override
    public AppraisalCycleResponse getById(Long id) {
        AppraisalCycle cycle = getCycleById(id);
        AppraisalCycleResponse resp = appraisalCycleMapper.toResponse(cycle);
        scoringWeightRepository.findByCycle_CycleId(cycle.getCycleId())
                .ifPresent(w -> mapWeightsToResponse(w, resp));
        resp.setIsAssigned(!appraisalRepository.findByCycle_CycleId(cycle.getCycleId()).isEmpty());
        return resp;
    }

    @Override
    @Transactional
    public AppraisalCycleResponse update(Long id, AppraisalCycleRequest request) {
        AppraisalCycle cycle = getCycleById(id);

        if (Boolean.TRUE.equals(request.getIsActive()) && !Boolean.TRUE.equals(cycle.getIsActive())) {
            checkForActiveCycles(id);
        }
        validateNoDateOverlap(request.getStartDate(), request.getEndDate(), id);

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
        response.setIsAssigned(!appraisalRepository.findByCycle_CycleId(id).isEmpty());
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
        AppraisalCycle cycle = getCycleById(id);

        // Check if cycle has any appraisals assigned
        if (!appraisalRepository.findByCycle_CycleId(id).isEmpty()) {
            throw new RuntimeException(
                    "Cannot delete cycle. It has active appraisals assigned. Please close or archive it instead.");
        }

        // 0. Find and delete related ScoringWeight first to satisfy DB FK constraints
        scoringWeightRepository.findByCycle_CycleId(id).ifPresent(scoringWeightRepository::delete);

        // 1. Find and delete related Forms cleanly (clearing child categories, questions, and references first)
        List<ace.org.epms_backend.model.appraisal.AppraisalForm> forms = new java.util.ArrayList<>(cycle.getForms());
        for (ace.org.epms_backend.model.appraisal.AppraisalForm form : forms) {
            appraisalFormService.deleteForm(form.getFormId());
        }

        // 2. Find and delete related FormSets after forms are gone to prevent transient references
        List<ace.org.epms_backend.model.appraisal.AppraisalFormSet> formSets = appraisalFormSetRepository.findByCycle_CycleId(id);
        appraisalFormSetRepository.deleteAll(formSets);

        // 3. Delete the cycle itself
        appraisalCycleRepository.delete(cycle);
    }

    @Override
    @Transactional
    public AppraisalCycleResponse activate(Long id) {
        AppraisalCycle cycle = getCycleById(id);

        checkForActiveCycles(id);

        cycle.setIsActive(true);
        cycle.setStatus(CycleStatus.IN_PROGRESS);
        cycle = appraisalCycleRepository.save(cycle);

        // Trigger Broadcast Notification
        eventPublisher.publishEvent(NotificationEvent.builder()
                .broadcast(true)
                .type(NotificationType.APPRAISAL_CYCLE_OPENED)
                .title("Appraisal Cycle Activated")
                .message("The appraisal cycle '" + cycle.getCycleName()
                        + "' has been activated. Self-assessments are now open.")
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
    public AppraisalCycleResponse advanceToEvaluation(Long id) {
        AppraisalCycle cycle = getCycleById(id);

        if (cycle.getStatus() != CycleStatus.IN_PROGRESS) {
            throw new RuntimeException(
                "Can only advance to EVALUATION from IN_PROGRESS. Current status: " + cycle.getStatus());
        }

        cycle.setStatus(CycleStatus.EVALUATION);
        cycle = appraisalCycleRepository.save(cycle);

        eventPublisher.publishEvent(NotificationEvent.builder()
                .broadcast(true)
                .type(NotificationType.CYCLE_PHASE_STARTED)
                .title("Manager Evaluation Phase Open")
                .message("The manager evaluation phase for appraisal cycle '"
                        + cycle.getCycleName() + "' is now open.")
                .referenceType(ReferenceType.APPRAISAL)
                .referenceId(cycle.getCycleId())
                .actionUrl("/appraisals")
                .build());

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
        List<AppraisalCycle> cycles = appraisalCycleRepository.findActiveCyclesByStatus(
            List.of(CycleStatus.PLANNING, CycleStatus.IN_PROGRESS, CycleStatus.EVALUATION)
        );
        
        // Fallback: If status-specific search fails, return the most recent active cycle regardless of status
        if (cycles.isEmpty()) {
            cycles = appraisalCycleRepository.findByIsActiveTrueOrderByCycleIdDesc();
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

    private void checkForActiveCycles(Long excludeCycleId) {
        List<AppraisalCycle> activeCycles = appraisalCycleRepository.findByIsActiveTrueOrderByCycleIdDesc();
        for (AppraisalCycle c : activeCycles) {
            if (excludeCycleId == null || !c.getCycleId().equals(excludeCycleId)) {
                throw new RuntimeException(
                        "Cannot activate this cycle. Another cycle '" + c.getCycleName()
                                + "' is currently active. Please close or archive it first.");
            }
        }
    }

    private void validateNoDateOverlap(java.time.LocalDate startDate, java.time.LocalDate endDate, Long excludeCycleId) {
        if (startDate == null || endDate == null) {
            return;
        }
        if (startDate.isAfter(endDate)) {
            throw new RuntimeException("Start date cannot be after end date.");
        }
        List<AppraisalCycle> allCycles = appraisalCycleRepository.findAll();
        for (AppraisalCycle c : allCycles) {
            if (excludeCycleId != null && c.getCycleId().equals(excludeCycleId)) {
                continue;
            }
            if (c.getStatus() == CycleStatus.ARCHIVED) {
                continue;
            }
            if (startDate.compareTo(c.getEndDate()) <= 0 && endDate.compareTo(c.getStartDate()) >= 0) {
                throw new RuntimeException(
                        "The cycle date range (" + startDate + " to " + endDate
                        + ") overlaps with an existing cycle '" + c.getCycleName()
                        + "' (" + c.getStartDate() + " to " + c.getEndDate() + ").");
            }
        }
    }

    /**
     * Called only by the scheduler when endDate is reached.
     * Bulk-archives FINALIZED appraisals and notifies HR of any incomplete ones.
     */
    @Override
    @org.springframework.transaction.annotation.Transactional
    public void schedulerDrivenClose(Long cycleId) {
        AppraisalCycle cycle = getCycleById(cycleId);

        // 1. Bulk-archive all FINALIZED appraisals in this cycle
        List<Appraisal> finalized = appraisalRepository
                .findByCycle_CycleIdAndStatus(cycleId, AppraisalStatus.FINALIZED);
        for (Appraisal a : finalized) {
            a.setStatus(AppraisalStatus.ARCHIVED);
        }
        if (!finalized.isEmpty()) {
            appraisalRepository.saveAll(finalized);
        }

        // 2. Find any appraisals that are NOT finalized/archived (incomplete)
        List<Appraisal> incomplete = appraisalRepository.findByCycleIdAndStatusNotIn(
                cycleId,
                java.util.List.of(AppraisalStatus.FINALIZED, AppraisalStatus.ARCHIVED));

        // 3. Close the cycle
        cycle.setIsActive(false);
        cycle.setStatus(CycleStatus.ARCHIVED);
        appraisalCycleRepository.save(cycle);

        // 4. Notify all users the cycle is closed
        eventPublisher.publishEvent(NotificationEvent.builder()
                .broadcast(true)
                .type(NotificationType.APPRAISAL_CYCLE_CLOSED)
                .title("Appraisal Cycle Closed")
                .message("The appraisal cycle '" + cycle.getCycleName() + "' has been automatically closed.")
                .referenceType(ReferenceType.APPRAISAL)
                .referenceId(cycleId)
                .actionUrl("/appraisals/history")
                .build());

        // 5. Notify HR about incomplete appraisals
        if (!incomplete.isEmpty()) {
            StringBuilder names = new StringBuilder();
            incomplete.forEach(a -> names.append(a.getEmployee().getStaffName())
                    .append(" (").append(a.getStatus()).append("), "));
            eventPublisher.publishEvent(NotificationEvent.builder()
                    .targetRole("HR")
                    .type(NotificationType.CYCLE_INCOMPLETE_APPRAISALS)
                    .title("Incomplete Appraisals at Cycle Close")
                    .message(incomplete.size() + " appraisal(s) were not completed when cycle '"
                            + cycle.getCycleName() + "' closed: " + names.toString().replaceAll(", $", ""))
                    .referenceType(ReferenceType.APPRAISAL)
                    .referenceId(cycleId)
                    .build());
        }

        // 6. Audit
        auditService.log(AuditRequest.builder()
                .tableName("appraisal_cycle")
                .recordId(cycleId)
                .action(AuditAction.UPDATE)
                .newState(cycle)
                .status(AuditStatus.SUCCESS)
                .build());
    }

    @Override
    @Transactional
    public void sendReminders(Long id) {
        System.out.println(">>> [DEBUG sendReminders] Triggering manual reminders for Cycle ID: " + id);
        AppraisalCycle cycle = getCycleById(id);
        List<Appraisal> appraisals = appraisalRepository.findByCycle_CycleId(id);
        System.out.println(">>> [DEBUG sendReminders] Found " + appraisals.size() + " appraisals for Cycle: " + cycle.getCycleName());

        for (Appraisal appraisal : appraisals) {
            AppraisalStatus status = appraisal.getStatus();
            String empName = appraisal.getEmployee() != null ? appraisal.getEmployee().getStaffName() : "Unknown";
            Long empId = appraisal.getEmployee() != null ? appraisal.getEmployee().getId() : null;
            Long mgrId = appraisal.getManager() != null ? appraisal.getManager().getId() : null;
            System.out.println(">>> [DEBUG sendReminders] Processing Appraisal ID: " + appraisal.getAppraisalId() 
                + ", Employee: " + empName + " (ID: " + empId + ")"
                + ", Status: " + status 
                + ", Manager ID: " + mgrId);

            if (status == AppraisalStatus.PENDING) {
                System.out.println(">>> [DEBUG sendReminders] Publishing SELF_ASSESSMENT_REMINDER to Employee ID: " + empId);
                eventPublisher.publishEvent(NotificationEvent.builder()
                        .recipientId(empId)
                        .type(NotificationType.SELF_ASSESSMENT_REMINDER)
                        .title("Self Assessment Reminder")
                        .message("Please complete your self-assessment for cycle: " + cycle.getCycleName())
                        .referenceType(ReferenceType.APPRAISAL)
                        .referenceId(appraisal.getAppraisalId())
                        .actionUrl("/appraisals/self-assessment/" + appraisal.getAppraisalId())
                        .build());
            } else if (status == AppraisalStatus.SELF_ASSESSED) {
                if (mgrId != null) {
                    System.out.println(">>> [DEBUG sendReminders] Publishing MANAGER_EVALUATION_REMINDER to Manager ID: " + mgrId);
                    eventPublisher.publishEvent(NotificationEvent.builder()
                            .recipientId(mgrId)
                            .type(NotificationType.MANAGER_EVALUATION_REMINDER)
                            .title("Manager Evaluation Reminder")
                            .message("Please complete the evaluation for: " + empName)
                            .referenceType(ReferenceType.APPRAISAL)
                            .referenceId(appraisal.getAppraisalId())
                            .actionUrl("/appraisals/manager-evaluation/" + appraisal.getAppraisalId())
                            .build());
                } else {
                    System.out.println(">>> [DEBUG sendReminders] WARNING: Appraisal ID " + appraisal.getAppraisalId() + " is SELF_ASSESSED but Manager is NULL!");
                }
            } else {
                System.out.println(">>> [DEBUG sendReminders] Status " + status + " does not require manual reminder.");
            }
        }

        // Log Audit
        auditService.log(AuditRequest.builder()
                .tableName("appraisal_cycle")
                .recordId(cycle.getCycleId())
                .action(AuditAction.UPDATE)
                .newState(cycle)
                .status(AuditStatus.SUCCESS)
                .build());
    }
}
