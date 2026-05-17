package ace.org.epms_backend.service.kpi.impl;

import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.dto.appraisal.AppraisalCycleResponse;
import ace.org.epms_backend.dto.kpi.*;
import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.enums.*;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.KpiMapper;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.kpi.*;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.repository.employee.ReportingLineRepository;
import ace.org.epms_backend.model.employee.ReportingLine;
import ace.org.epms_backend.service.AuditService;
import ace.org.epms_backend.service.kpi.KpiGoalService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KpiGoalServiceImpl implements KpiGoalService {

    private final KpiGoalsRepository goalsRepository;
    private final KpiGoalItemRepository goalItemRepository;
    private final KpiLibraryRepository libraryRepository;
    private final AppraisalCycleRepository cycleRepository;
    private final EmployeeRepository employeeRepository;
    private final KpiCategoryRepository categoryRepository;
    private final KpiProgressRepository progressRepository;
    private final KpiHistoryLogRepository historyRepo;
    private final KpiMapper kpiMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final AuditService auditService;
    private final ReportingLineRepository reportingLineRepo;

    @Override
    @Transactional(readOnly = true)
    public AppraisalCycleResponse getActiveCycle() {
        List<AppraisalCycle> cycles = cycleRepository.findActiveCyclesByStatus(List.of(CycleStatus.PLANNING, CycleStatus.IN_PROGRESS));
        
        // Fallback: If status-specific search fails, return the first active cycle regardless of status
        if (cycles.isEmpty()) {
            cycles = cycleRepository.findByIsActiveTrueOrderByCycleIdDesc();
        }   

        AppraisalCycle cycle = cycles.stream().findFirst()
                .orElseThrow(() -> new NotFoundException("No active appraisal cycle found"));
        System.out.println(cycle.getCycleId());
        System.out.println(cycle.getCycleName());
        return AppraisalCycleResponse.builder()
                .cycleId(cycle.getCycleId())
                .cycleName(cycle.getCycleName())
                .build();
    }

    @Override
    @Transactional
    public GoalSetResponse assignKpiToEmployee(GoalAssignmentRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        KpiLibrary library = null;
        if (request.getLibraryId() != null) {
            library = libraryRepository.findById(request.getLibraryId())
                    .orElseThrow(() -> new NotFoundException("Library not found"));
            if (!library.getIsActive()) {
                throw new IllegalArgumentException("Cannot assign from an inactive library");
            }
        }
        AppraisalCycle cycle = cycleRepository.findById(request.getAppraisalCycleId())
                .orElseThrow(() -> new NotFoundException("Selected appraisal cycle not found. ID: " + request.getAppraisalCycleId()));

        Employee currentManager = getCurrentEmployee();

        // Security check: Only allow if Manager, HR, or ADMIN
        var authorities = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .map(a -> a.getAuthority())
                .collect(Collectors.toSet());

        boolean isHrOrAdmin = authorities.contains("ROLE_HR") || authorities.contains("ROLE_ADMIN");
        boolean isManager = authorities.contains("ROLE_MANAGER");

        if (!isHrOrAdmin && !isManager) {
            throw new SecurityException("Insufficient permissions to assign goals");
        }

        // Atomic archive existing goals
        List<KpiGoals> existing = goalsRepository.findAllByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(
                request.getEmployeeId(), cycle.getCycleId());

        if (!existing.isEmpty()) {
            boolean hasApprovedOrLocked = existing.stream()
                    .anyMatch(g -> g.getStatus() == KpiGoalStatus.APPROVED
                            || g.getStatus() == KpiGoalStatus.LOCKED);

            if (hasApprovedOrLocked) {
                throw new IllegalStateException(
                        "Employee already has APPROVED or LOCKED goals for this cycle. Cannot overwrite.");
            }

            if (request.isOverwriteExisting()) {
                goalsRepository.archiveExistingGoalSets(request.getEmployeeId(), cycle.getCycleId());
            } else {
                throw new IllegalStateException(
                        "Employee already has goals assigned for this cycle. Use the overwrite option if you wish to replace them.");
            }
        }

        KpiGoals goalSet = KpiGoals.builder()
                .employee(employee)
                .manager(currentManager)
                .cycle(cycle)
                .status(KpiGoalStatus.DRAFT)
                .version(1)
                .isCurrent(true)
                .build();

        KpiGoals savedGoalSet = goalsRepository.save(goalSet);

        // Copy library details to goal items if library exists
        if (library != null) {
            List<KpiGoalItem> goalItems = library.getDetails().stream().map(libDetail -> {
                return KpiGoalItem.builder()
                        .goalSet(savedGoalSet)
                        .title(libDetail.getGoalTitle())
                        .targetValue(libDetail.getTargetValue())
                        .unit(libDetail.getUnit())
                        .weightPercent(libDetail.getWeightPercent())
                        .category(libDetail.getCategory())
                        .actualValue(BigDecimal.ZERO)
                        .scorePercent(BigDecimal.ZERO)
                        .weightedScore(BigDecimal.ZERO)
                        .status(KpiItemStatus.NOT_STARTED)
                        .isCompliance(libDetail.getIsCompliance())
                        .isActive(true)
                        .build();
            }).collect(Collectors.toList());

            goalItemRepository.saveAll(goalItems);
        }

        // Trigger Notification
        eventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(request.getEmployeeId())
                .senderId(currentManager.getId())
                .type(NotificationType.KPI_ASSIGNED)
                .title("New KPI Assigned")
                .message("A new KPI set has been assigned to you for the current cycle.")
                .referenceType(ReferenceType.KPI)
                .referenceId(savedGoalSet.getId())
                .actionUrl("/kpi/my")
                .build());

        // Log KPI Journey
        historyRepo.save(KpiHistoryLog.builder()
                .employeeId(savedGoalSet.getEmployee().getId())
                .goalSetId(savedGoalSet.getId())
                .action("KPI_ASSIGNED")
                .changeDetails(
                        "Goal set assigned to " + employee.getStaffName() + " for cycle: " + cycle.getCycleName())
                .changedBy(currentManager.getId())
                .build());

        // Log Audit
        auditService.log(AuditRequest.builder()
                .tableName("kpi_goals")
                .recordId(savedGoalSet.getId())
                .action(AuditAction.INSERT)
                .newState(savedGoalSet)
                .status(AuditStatus.SUCCESS)
                .build());

        return kpiMapper.toGoalSetResponse(savedGoalSet);
    }

    @Override
    @Transactional
    public BulkAssignmentResponse bulkAssignKpi(BulkGoalAssignmentRequest request) {
        KpiLibrary library = libraryRepository.findById(request.getLibraryId())
                .orElseThrow(() -> new NotFoundException("Library not found"));

        if (!library.getIsActive()) {
            throw new IllegalArgumentException("Cannot assign from an inactive library");
        }

        AppraisalCycle cycle = cycleRepository.findById(request.getAppraisalCycleId())
                .orElseThrow(() -> new NotFoundException("Selected appraisal cycle not found. ID: " + request.getAppraisalCycleId()));

        Employee currentManager = getCurrentEmployee();

        BulkAssignmentResponse response = new BulkAssignmentResponse();
        response.setResults(new java.util.ArrayList<>());
        response.setTotalProcessed(request.getEmployeeIds().size());

        for (Long employeeId : request.getEmployeeIds()) {
            Employee employee = employeeRepository.findById(employeeId).orElse(null);

            if (employee == null) {
                response.setFailedCount(response.getFailedCount() + 1);
                response.getResults().add(AssignmentResult.builder()
                        .employeeId(employeeId)
                        .employeeName("Unknown")
                        .status("FAILED")
                        .reason("Employee not found")
                        .build());
                continue;
            }

            try {
                // Check for existing goals
                List<KpiGoals> existing = goalsRepository.findAllByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(
                        employeeId, cycle.getCycleId());

                if (!existing.isEmpty()) {
                    boolean hasApprovedOrLocked = existing.stream()
                            .anyMatch(g -> g.getStatus() == KpiGoalStatus.APPROVED
                                    || g.getStatus() == KpiGoalStatus.LOCKED);

                    if (hasApprovedOrLocked) {
                        // Never overwrite Approved or Locked goals via Bulk Assign
                        response.setSkippedCount(response.getSkippedCount() + 1);
                        response.getResults().add(AssignmentResult.builder()
                                .employeeId(employeeId)
                                .employeeName(employee.getStaffName())
                                .status("SKIPPED")
                                .reason("Employee has APPROVED/LOCKED goals. Cannot overwrite via bulk assignment.")
                                .build());
                        continue;
                    }

                    if (request.isOverwriteExisting()) {
                        // Only archives DRAFT goals (per repository update)
                        goalsRepository.archiveExistingGoalSets(employeeId, cycle.getCycleId());
                    } else {
                        // Skip if overwrite not checked
                        response.setSkippedCount(response.getSkippedCount() + 1);
                        response.getResults().add(AssignmentResult.builder()
                                .employeeId(employeeId)
                                .employeeName(employee.getStaffName())
                                .status("SKIPPED")
                                .reason("Employee already has goals assigned for this cycle")
                                .build());
                        continue;
                    }
                }

                // Create Draft Goal Set
                KpiGoals goalSet = KpiGoals.builder()
                        .employee(employee)
                        .manager(currentManager)
                        .cycle(cycle)
                        .status(KpiGoalStatus.DRAFT)
                        .version(1)
                        .isCurrent(true)
                        .build();

                KpiGoals savedGoalSet = goalsRepository.save(goalSet);

                // Copy library details
                List<KpiGoalItem> goalItems = library.getDetails().stream().map(libDetail -> {
                    return KpiGoalItem.builder()
                            .goalSet(savedGoalSet)
                            .title(libDetail.getGoalTitle())
                            .targetValue(libDetail.getTargetValue())
                            .unit(libDetail.getUnit())
                            .weightPercent(libDetail.getWeightPercent())
                            .category(libDetail.getCategory())
                            .actualValue(BigDecimal.ZERO)
                            .scorePercent(BigDecimal.ZERO)
                            .weightedScore(BigDecimal.ZERO)
                            .status(KpiItemStatus.NOT_STARTED)
                            .isCompliance(libDetail.getIsCompliance())
                            .isActive(true)
                            .build();
                }).collect(Collectors.toList());

                goalItemRepository.saveAll(goalItems);

                // Trigger Notification
                eventPublisher.publishEvent(NotificationEvent.builder()
                        .recipientId(employee.getId())
                        .senderId(currentManager.getId())
                        .type(NotificationType.KPI_ASSIGNED)
                        .title("New KPI Assigned (Bulk)")
                        .message("A new KPI set has been bulk-assigned to you from library: "
                                + library.getTitle())
                        .referenceType(ReferenceType.KPI)
                        .referenceId(savedGoalSet.getId())
                        .actionUrl("/kpi/my")
                        .build());

                response.setSuccessfulCount(response.getSuccessfulCount() + 1);
                response.getResults().add(AssignmentResult.builder()
                        .employeeId(employeeId)
                        .employeeName(employee.getStaffName())
                        .status("SUCCESS")
                        .reason("Goals assigned successfully")
                        .build());
            } catch (Exception e) {
                response.setFailedCount(response.getFailedCount() + 1);
                response.getResults().add(AssignmentResult.builder()
                        .employeeId(employeeId)
                        .employeeName(employee.getStaffName())
                        .status("FAILED")
                        .reason(e.getMessage() != null ? e.getMessage() : "Unknown error occurred")
                        .build());
            }
        }

        return response;
    }

    @Override
    @Transactional
    public GoalSetResponse addGoalItem(Long goalSetId, KpiGoalItemRequest request) {
        KpiGoals goalSet = goalsRepository.findById(goalSetId)
                .orElseThrow(() -> new NotFoundException("Goal set not found"));

        if (!goalSet.getStatus().equals(KpiGoalStatus.DRAFT)) {
            throw new IllegalStateException("Only DRAFT goals can be modified");
        }

        if (request.getWeightPercent().compareTo(new BigDecimal("35")) > 0) {
            throw new IllegalArgumentException("Individual KPI weight cannot exceed 35%");
        }

        KpiGoalItem item = KpiGoalItem.builder()
                .goalSet(goalSet)
                .title(request.getTitle())
                .unit(request.getUnit())
                .targetValue(request.getTargetValue())
                .weightPercent(request.getWeightPercent())
                .category(categoryRepository.findById(request.getCategoryId())
                        .orElseThrow(() -> new NotFoundException("Category not found")))
                .actualValue(BigDecimal.ZERO)
                .scorePercent(BigDecimal.ZERO)
                .weightedScore(BigDecimal.ZERO)
                .status(KpiItemStatus.NOT_STARTED)
                .isCompliance(request.getIsCompliance())
                .isActive(true)
                .build();

        goalItemRepository.save(item);
        goalSet.getItems().add(item);
        return kpiMapper.toGoalSetResponse(goalSet);
    }

    @Override
    @Transactional
    public GoalSetResponse updateGoalItem(Long itemId, KpiGoalItemRequest request) {
        KpiGoalItem item = goalItemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Goal item not found"));

        KpiGoals goalSet = item.getGoalSet();
        if (!goalSet.getStatus().equals(KpiGoalStatus.DRAFT)) {
            throw new IllegalStateException("Only DRAFT goals can be modified");
        }

        if (request.getWeightPercent().compareTo(new BigDecimal("35")) > 0) {
            throw new IllegalArgumentException("Individual KPI weight cannot exceed 35%");
        }

        item.setTitle(request.getTitle());
        item.setUnit(request.getUnit());
        item.setTargetValue(request.getTargetValue());
        item.setWeightPercent(request.getWeightPercent());
        item.setCategory(categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new NotFoundException("Category not found")));
        item.setIsCompliance(request.getIsCompliance());

        goalItemRepository.save(item);
        return kpiMapper.toGoalSetResponse(goalSet);
    }

    @Override
    @Transactional
    public GoalSetResponse deleteGoalItem(Long itemId) {
        KpiGoalItem item = goalItemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Goal item not found"));

        KpiGoals goalSet = item.getGoalSet();
        if (!goalSet.getStatus().equals(KpiGoalStatus.DRAFT)) {
            throw new IllegalStateException("Only DRAFT goals can be modified");
        }

        // Block deletion if this item has progress history
        List<KpiProgress> progressRecords = progressRepository.findByGoalItemIdOrderByIdDesc(item.getId());
        if (!progressRecords.isEmpty()) {
            throw new IllegalStateException(
                    "This goal has existing progress records and cannot be deleted. "
                            + "Use the Revise flow to modify it instead, so employee progress is preserved.");
        }

        goalSet.getItems().remove(item);
        goalItemRepository.delete(item);
        return kpiMapper.toGoalSetResponse(goalSet);
    }

    @Override
    @Transactional
    public GoalSetResponse bulkUpdateGoalItems(Long goalSetId, KpiGoalBulkUpdateRequest request) {
        KpiGoals goalSet = goalsRepository.findById(goalSetId)
                .orElseThrow(() -> new NotFoundException("Goal set not found"));

        if (!goalSet.getStatus().equals(KpiGoalStatus.DRAFT)) {
            throw new IllegalStateException("Only DRAFT goals can be modified");
        }

        for (KpiGoalBulkUpdateRequest.ItemUpdate update : request.getItems()) {
            KpiGoalItem item = goalItemRepository.findById(update.getId())
                    .orElseThrow(() -> new NotFoundException(
                            "Goal item not found: " + update.getId()));

            if (!item.getGoalSet().getId().equals(goalSetId)) {
                throw new IllegalArgumentException("Item does not belong to this goal set");
            }

            item.setTitle(update.getTitle());
            item.setUnit(update.getUnit());
            item.setTargetValue(update.getTargetValue());
            item.setWeightPercent(update.getWeightPercent());
            item.setCategory(categoryRepository.findById(update.getCategoryId())
                    .orElseThrow(() -> new NotFoundException("Category not found")));

            goalItemRepository.save(item);
        }

        return kpiMapper.toGoalSetResponse(goalSet);
    }

    @Override
    @Transactional
    public GoalSetResponse approveGoalSet(Long goalSetId) {
        KpiGoals goalSet = goalsRepository.findById(goalSetId)
                .orElseThrow(() -> new NotFoundException("Goal set not found"));

        boolean isHrOrAdmin = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_HR")
                        || a.getAuthority().equals("ROLE_ADMIN"));

        if (!isHrOrAdmin) {
            Long currentUserId = getCurrentEmployee().getId();
            boolean isCreatorManager = goalSet.getManager() != null
                    && goalSet.getManager().getId().equals(currentUserId);

            boolean isDirectManager = false;
            if (!isCreatorManager && goalSet.getEmployee() != null) {
                ReportingLine rl = reportingLineRepo.findByEmployeeAndIsActiveTrue(goalSet.getEmployee()).orElse(null);
                if (rl != null && rl.getManager() != null && rl.getManager().getId().equals(currentUserId)) {
                    isDirectManager = true;
                }
            }

            if (!isCreatorManager && !isDirectManager) {
                throw new SecurityException("Only the assigned manager or HR/Admin can approve this goal set");
            }
        }

        if (!goalSet.getStatus().equals(KpiGoalStatus.DRAFT)) {
            throw new IllegalStateException("Only DRAFT goals can be approved");
        }

        BigDecimal totalWeight = goalSet.getItems().stream()
                .filter(item -> Boolean.TRUE.equals(item.getIsActive()))
                .map(item -> item.getWeightPercent() != null ? item.getWeightPercent() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalWeight.compareTo(new BigDecimal("100")) != 0) {
            throw new IllegalArgumentException("Total weight of active goal items must be exactly 100%");
        }

        goalSet.setStatus(KpiGoalStatus.APPROVED);
        goalSet.setApprovedAt(Instant.now());
        goalSet.setApprovedBy(getCurrentEmployee().getId());
        KpiGoals savedGoalSet = goalsRepository.save(goalSet);

        // Trigger Notification
        if (goalSet.getEmployee() != null) {
            eventPublisher.publishEvent(NotificationEvent.builder()
                    .recipientId(goalSet.getEmployee().getId())
                    .senderId(getCurrentEmployee().getId())
                    .type(NotificationType.KPI_APPROVED)
                    .title("KPI Approved")
                    .message("Your Manager has approved your KPI goals.")
                    .referenceType(ReferenceType.KPI)
                    .referenceId(goalSet.getId())
                    .actionUrl("/kpi/my")
                    .build());
        }

        // Log KPI Journey
        historyRepo.save(KpiHistoryLog.builder()
                .employeeId(goalSet.getEmployee().getId())
                .goalSetId(goalSet.getId())
                .action("KPI_APPROVED")
                .changeDetails("Goal set approved for cycle: " + goalSet.getCycle().getCycleName())
                .changedBy(getCurrentEmployee().getId())
                .build());

        // Log Audit
        auditService.log(AuditRequest.builder()
                .tableName("kpi_goals")
                .recordId(savedGoalSet.getId())
                .action(AuditAction.UPDATE)
                .newState(savedGoalSet)
                .status(AuditStatus.SUCCESS)
                .build());

        return kpiMapper.toGoalSetResponse(savedGoalSet);
    }

    @Override
    @Transactional
    public GoalSetResponse revertToDraft(Long goalSetId) {
        KpiGoals goalSet = goalsRepository.findById(goalSetId)
                .orElseThrow(() -> new NotFoundException("Goal set not found"));

        if (goalSet.getStatus() == KpiGoalStatus.DRAFT) {
            return kpiMapper.toGoalSetResponse(goalSet);
        }

        if (goalSet.getStatus() == KpiGoalStatus.ARCHIVED) {
            throw new IllegalStateException("Cannot revert archived goals");
        }

        goalSet.setStatus(KpiGoalStatus.DRAFT);
        KpiGoals savedGoalSet = goalsRepository.save(goalSet);

        // Notify employee that their goals have been reverted to draft
        if (goalSet.getEmployee() != null) {
            eventPublisher.publishEvent(NotificationEvent.builder()
                    .recipientId(goalSet.getEmployee().getId())
                    .senderId(getCurrentEmployee().getId())
                    .type(NotificationType.KPI_REJECTED)
                    .title("KPI Reverted to Draft")
                    .message("Your KPI goals have been returned to draft by your manager. Please check with your manager for further instructions.")
                    .referenceType(ReferenceType.KPI)
                    .referenceId(goalSet.getId())
                    .actionUrl("/kpi/my")
                    .build());
        }

        return kpiMapper.toGoalSetResponse(savedGoalSet);
    }

    // submitGoalSet and rejectGoalSet have been removed as part of the new top-down
    // workflow

    @Override
    @Transactional
    public GoalSetResponse lockGoalSet(Long goalSetId) {
        KpiGoals goalSet = goalsRepository.findById(goalSetId)
                .orElseThrow(() -> new NotFoundException("Goal set not found"));

        if (!goalSet.getStatus().equals(KpiGoalStatus.APPROVED)) {
            throw new IllegalStateException("Only APPROVED goals can be locked");
        }

        goalSet.setStatus(KpiGoalStatus.LOCKED);
        KpiGoals savedGoalSet = goalsRepository.save(goalSet);

        // Notify employee that their goals have been locked
        if (goalSet.getEmployee() != null) {
            eventPublisher.publishEvent(NotificationEvent.builder()
                    .recipientId(goalSet.getEmployee().getId())
                    .senderId(getCurrentEmployee().getId())
                    .type(NotificationType.KPI_LOCKED)
                    .title("KPI Goals Locked")
                    .message("Your KPI goals have been locked by your manager. No further progress updates can be made.")
                    .referenceType(ReferenceType.KPI)
                    .referenceId(goalSet.getId())
                    .actionUrl("/kpi/my")
                    .build());
        }

        // Log KPI Journey
        historyRepo.save(KpiHistoryLog.builder()
                .employeeId(goalSet.getEmployee().getId())
                .goalSetId(goalSet.getId())
                .action("KPI_LOCKED")
                .changeDetails("Performance goals locked for review.")
                .changedBy(getCurrentEmployee().getId())
                .build());

        return kpiMapper.toGoalSetResponse(savedGoalSet);
    }

    @Override
    @Transactional
    public GoalSetResponse reviseKpi(Long itemId, KpiRevisionRequest request) {
        KpiGoalItem item = goalItemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Goal item not found"));
        KpiGoals goalSet = item.getGoalSet();

        Employee currentUser = getCurrentEmployee();

        // Only the assigned manager (or HR/Admin) can revise
        boolean isHrOrAdmin = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_HR")
                        || a.getAuthority().equals("ROLE_ADMIN"));

        if (!isHrOrAdmin) {
            boolean isCreatorManager = goalSet.getManager() != null
                    && goalSet.getManager().getId().equals(currentUser.getId());

            boolean isDirectManager = false;
            if (!isCreatorManager && goalSet.getEmployee() != null) {
                ReportingLine rl = reportingLineRepo.findByEmployeeAndIsActiveTrue(goalSet.getEmployee()).orElse(null);
                if (rl != null && rl.getManager() != null && rl.getManager().getId().equals(currentUser.getId())) {
                    isDirectManager = true;
                }
            }

            if (!isCreatorManager && !isDirectManager) {
                throw new SecurityException("You are not authorized to revise this goal item.");
            }
        }

        // Only APPROVED or DRAFT goal sets can be revised
        if (!goalSet.getStatus().equals(KpiGoalStatus.APPROVED)
                && !goalSet.getStatus().equals(KpiGoalStatus.DRAFT)) {
            throw new IllegalStateException(
                    "Cannot revise a goal item on a " + goalSet.getStatus() + " goal set.");
        }

        // Build change details for audit trail (old → new)
        StringBuilder changes = new StringBuilder();
        KpiLibraryDetailRequest details = request.getUpdatedDetails();

        if (details.getGoalTitle() != null && !details.getGoalTitle().equals(item.getTitle())) {
            changes.append("Title: '").append(item.getTitle()).append("' → '")
                    .append(details.getGoalTitle()).append("'; ");
            item.setTitle(details.getGoalTitle());
        }

        if (details.getTargetValue() != null
                && details.getTargetValue().compareTo(item.getTargetValue()) != 0) {
            changes.append("Target: ").append(item.getTargetValue()).append(" → ")
                    .append(details.getTargetValue()).append("; ");
            item.setTargetValue(details.getTargetValue());
        }

        if (details.getWeightPercent() != null
                && details.getWeightPercent().compareTo(item.getWeightPercent()) != 0) {
            changes.append("Weight: ").append(item.getWeightPercent()).append("% → ")
                    .append(details.getWeightPercent()).append("%; ");
            item.setWeightPercent(details.getWeightPercent());
        }

        if (details.getCategoryId() != null
                && (item.getCategory() == null
                        || !details.getCategoryId().equals(item.getCategory().getId()))) {
            String oldCategoryName = item.getCategory() != null
                    ? item.getCategory().getName()
                    : "None";
            KpiCategory newCategory = categoryRepository.findById(details.getCategoryId())
                    .orElseThrow(() -> new NotFoundException("Category not found"));
            changes.append("Category: '").append(oldCategoryName).append("' → '")
                    .append(newCategory.getName()).append("'; ");
            item.setCategory(newCategory);
        }

        if (changes.length() == 0) {
            throw new IllegalArgumentException("No changes detected in the revision request.");
        }

        // Save the in-place updated item — progress history stays intact
        goalItemRepository.save(item);

        // Bump goal set version to track that a revision occurred
        goalSet.setVersion(goalSet.getVersion() + 1);
        goalsRepository.save(goalSet);

        // Notify employee about the revision
        if (goalSet.getEmployee() != null) {
            eventPublisher.publishEvent(NotificationEvent.builder()
                    .recipientId(goalSet.getEmployee().getId())
                    .senderId(currentUser.getId())
                    .type(NotificationType.KPI_REVISED)
                    .title("KPI Goal Revised")
                    .message("Your KPI goal '" + item.getTitle() + "' has been revised by your manager. Reason: " + request.getChangeReason())
                    .referenceType(ReferenceType.KPI)
                    .referenceId(goalSet.getId())
                    .actionUrl("/kpi/my")
                    .build());
        }

        // Detailed audit log
        historyRepo.save(
                KpiHistoryLog.builder()
                        .employeeId(goalSet.getEmployee().getId())
                        .goalSetId(goalSet.getId())
                        .itemId(itemId)
                        .action("ITEM_REVISED")
                        .changeReason(request.getChangeReason())
                        .changeDetails(changes.toString().trim())
                        .changedBy(currentUser.getId())
                        .build());

        return kpiMapper.toGoalSetResponse(goalSet);
    }

    @Override
    @Transactional(readOnly = true)
    public GoalSetResponse getGoalSetByEmployee(Long employeeId, Long cycleId) {
        if (cycleId == null) {
            throw new IllegalArgumentException("Appraisal Cycle ID must be provided.");
        }
        // First try finding for the specific cycle provided
        List<KpiGoals> goals = goalsRepository.findAllByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(employeeId, cycleId);
        
        if (goals.isEmpty()) {
            // Fallback: If cycleId was not provided or correctly matched, look for ANY current goal set 
            // for the employee to see if they were accidentally assigned to a different cycle (like ID 1)
            goals = goalsRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId).stream()
                    .filter(KpiGoals::getIsCurrent)
                    .collect(Collectors.toList());
        }

        if (goals.isEmpty()) {
            throw new NotFoundException("Current goal set not found for employee ID: " + employeeId);
        }
        
        return kpiMapper.toGoalSetResponse(goals.get(0));
    }

    @Override
    @Transactional(readOnly = true)
    public GoalSetResponse getGoalSetById(Long id) {
        return goalsRepository.findById(id)
                .map(kpiMapper::toGoalSetResponse)
                .orElseThrow(() -> new NotFoundException("Goal set not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<GoalSetResponse> getEmployeeGoalSets(Long employeeId) {
        return goalsRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId).stream()
                .map(kpiMapper::toGoalSetResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<GoalSetResponse> getTeamGoalSets(Long managerId, Long cycleId) {
        return goalsRepository.findTeamGoals(managerId, cycleId).stream()
                .map(kpiMapper::toGoalSetResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<GoalSetResponse> getDepartmentGoalSets(Long departmentId, Long cycleId) {
        return goalsRepository.findByCycleAndDepartment(cycleId, departmentId).stream()
                .map(kpiMapper::toGoalSetResponse)
                .collect(Collectors.toList());
    }

    private Employee getCurrentEmployee() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return employeeRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Current user not found"));
    }
}