package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.appraisal.AppraisalCycleResponse;
import ace.org.epms_backend.dto.kpi.*;
import ace.org.epms_backend.enums.KpiGoalStatus;
import ace.org.epms_backend.enums.KpiItemStatus;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.KpiMapper;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.kpi.*;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.KpiService;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;
import ace.org.epms_backend.dto.notification.NotificationEvent;
import lombok.RequiredArgsConstructor;
import ace.org.epms_backend.enums.AuditAction;
import ace.org.epms_backend.enums.AuditStatus;
import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.service.AuditService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KpiServiceImpl implements KpiService {

        private final KpiLibraryRepository libraryRepository;
        private final KpiLibraryDetailsRepository libraryDetailsRepository;
        private final KpiGoalsRepository goalsRepository;
        private final KpiGoalItemRepository goalItemRepository;
        private final KpiProgressRepository progressRepository;
        private final KpiFinalScoreRepository finalScoreRepository;
        private final EmployeeRepository employeeRepository;
        private final PositionRepository positionRepository;
        private final KpiMapper kpiMapper;
        private final KpiHistoryLogRepository historyRepo;
        private final KpiCategoryRepository categoryRepository;
        private final ApplicationEventPublisher eventPublisher;
        private final AuditService auditService;
        private final AppraisalCycleRepository cycleRepository;

        @Override
        public AppraisalCycleResponse getActiveCycle() {
                AppraisalCycle cycle = cycleRepository.findByIsActiveTrue().stream().findFirst()
                                .orElseThrow(() -> new NotFoundException("No active appraisal cycle found"));
                return AppraisalCycleResponse.builder()
                                .cycleId(cycle.getCycleId())
                                .cycleName(cycle.getCycleName())
                                .build();
        }

        @Override
        @Transactional
        public KpiLibraryResponse createLibrary(KpiLibraryRequest request) {
                // Check individual item cap (35%)
                boolean anyItemExceedsCap = request.getDetails().stream()
                                .anyMatch(d -> d.getWeightPercent().compareTo(new BigDecimal("35")) > 0);

                if (anyItemExceedsCap) {
                        throw new IllegalArgumentException("Individual KPI weight cannot exceed 35%");
                }

                BigDecimal totalWeight = request.getDetails().stream()
                                .map(KpiLibraryDetailRequest::getWeightPercent)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                // Check total weight (100%)
                if (totalWeight.compareTo(new BigDecimal("100")) != 0) {
                        throw new IllegalArgumentException("Total weight must be exactly 100%");
                }

                KpiLibrary library = kpiMapper.toLibraryEntity(request);
                library.setPosition(positionRepository.findById(request.getPositionId())
                                .orElseThrow(() -> new NotFoundException("Position not found")));

                KpiLibrary savedLibrary = libraryRepository.save(library);

                List<KpiLibraryDetails> details = request.getDetails().stream().map(d -> {
                        if (d.getCategoryId() == null) {
                                throw new IllegalArgumentException("Category ID is required");
                        }
                        KpiLibraryDetails detail = kpiMapper.toLibraryDetailEntity(d);
                        detail.setLibrary(savedLibrary);
                        detail.setCategory(categoryRepository.findById(d.getCategoryId())
                                        .orElseThrow(() -> new NotFoundException("Category not found")));
                        return detail;
                }).collect(Collectors.toList());

                // libraryDetailsRepository.saveAll(details);
                savedLibrary.setDetails(details);

                return kpiMapper.toLibraryResponse(savedLibrary);
        }

        @Override
        public List<KpiLibraryResponse> getAllActiveLibraries() {
                return libraryRepository.findByIsActiveTrue().stream()
                                .map(kpiMapper::toLibraryResponse)
                                .collect(Collectors.toList());
        }

        @Override
        @Transactional
        public KpiLibraryResponse toggleLibraryStatus(Long id, boolean status) {
                KpiLibrary library = libraryRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException("Library not found"));
                library.setIsActive(status);
                KpiLibrary updatedLibrary = libraryRepository.save(library);
                return kpiMapper.toLibraryResponse(updatedLibrary);
        }

        @Override
        public List<KpiCategoryResponse> getAllCategories() {
                return categoryRepository.findAll().stream()
                                .map(cat -> KpiCategoryResponse.builder()
                                                .id(cat.getId())
                                                .name(cat.getName())
                                                .build())
                                .collect(Collectors.toList());
        }

        @Override
        @Transactional
        public GoalSetResponse assignKpiToEmployee(GoalAssignmentRequest request) {
                Employee employee = employeeRepository.findById(request.getEmployeeId())
                                .orElseThrow(() -> new NotFoundException("Employee not found"));

                KpiLibrary library = libraryRepository.findById(request.getLibraryId())
                                .orElseThrow(() -> new NotFoundException("Library not found"));
                AppraisalCycle cycle = cycleRepository.findById(request.getAppraisalCycleId())
                                .orElseThrow(() -> new NotFoundException("Appraisal Cycle Not found"));
                if (!library.getIsActive()) {
                        throw new IllegalArgumentException("Cannot assign from an inactive library");
                }
                Employee currentManager = getCurrentEmployee();

                KpiGoals goalSet = KpiGoals.builder()
                                .employee(employee)
                                .manager(currentManager)
                                .cycle(cycle) // fixed from test branch
                                .status(KpiGoalStatus.DRAFT)
                                .version(1)
                                .isCurrent(true)
                                .build();

                KpiGoals savedGoalSet = goalsRepository.save(goalSet);

                // Copy library details to goal items
                List<KpiGoalItem> goalItems = library.getDetails().stream().map(libDetail -> {
                        return KpiGoalItem.builder()
                                        .goalSet(savedGoalSet)
                                        .title(libDetail.getGoalTitle())
                                        .targetValue(libDetail.getTargetValue())
                                        .weightPercent(libDetail.getWeightPercent())
                                        .category(libDetail.getCategory())
                                        .status(KpiItemStatus.NOT_STARTED)
                                        .isActive(true)
                                        .build();
                }).collect(Collectors.toList());

                goalItemRepository.saveAll(goalItems);

                // Trigger Notification
                eventPublisher.publishEvent(NotificationEvent.builder()
                                .recipientId(request.getEmployeeId())
                                .senderId(currentManager.getId())
                                .type(NotificationType.KPI_ASSIGNED)
                                .title("New KPI Assigned")
                                .message("A new KPI set has been assigned to you for the current cycle.")
                                .referenceType(ReferenceType.KPI)
                                .referenceId(savedGoalSet.getId())
                                .actionUrl("/kpis/my-goals")
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
                                .status(KpiItemStatus.NOT_STARTED)
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

                goalItemRepository.delete(item);
                goalSet.getItems().remove(item);
                return kpiMapper.toGoalSetResponse(goalSet);
        }

        @Override
        @Transactional
        public GoalSetResponse approveGoalSet(Long goalSetId) {
                KpiGoals goalSet = goalsRepository.findById(goalSetId)
                                .orElseThrow(() -> new NotFoundException("Goal set not found"));

                if (!goalSet.getManager().getId().equals(getCurrentEmployee().getId())) {
                        throw new SecurityException("Only the assigned manager can approve this goal set");
                }

                if (!goalSet.getStatus().equals(KpiGoalStatus.DRAFT)) {
                        throw new IllegalStateException("Only DRAFT goals can be approved");
                }

                BigDecimal totalWeight = goalSet.getItems().stream()
                                .filter(KpiGoalItem::getIsActive)
                                .map(KpiGoalItem::getWeightPercent)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                if (totalWeight.compareTo(new BigDecimal("100")) != 0) {
                        throw new IllegalArgumentException("Total weight of goal items must be exactly 100%");
                }

                goalSet.setStatus(KpiGoalStatus.APPROVED);
                goalSet.setApprovedAt(Instant.now());
                goalSet.setApprovedBy(getCurrentEmployee().getId());
                KpiGoals savedGoalSet = goalsRepository.save(goalSet);

                // Trigger Notification
                eventPublisher.publishEvent(NotificationEvent.builder()
                                .recipientId(goalSet.getEmployee().getId())
                                .senderId(getCurrentEmployee().getId())
                                .type(NotificationType.KPI_APPROVED)
                                .title("KPI Approved")
                                .message("Your Manager has approved your KPI goals.")
                                .referenceType(ReferenceType.KPI)
                                .referenceId(goalSet.getId())
                                .actionUrl("/kpis/my-goals")
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
        public GoalSetResponse updateProgress(ProgressRequest request) {
                KpiGoalItem item = goalItemRepository.findById(request.getGoalItemId())
                                .orElseThrow(() -> new NotFoundException("Goal item not found"));

                if (!item.getGoalSet().getStatus().equals(KpiGoalStatus.APPROVED)) {
                        throw new IllegalStateException("Cannot update progress for non-approved goals");
                }

                Employee currentUser = getCurrentEmployee();
                if (!item.getGoalSet().getEmployee().getId().equals(currentUser.getId())) {
                        throw new SecurityException("Only the employee can update their progress");
                }

                KpiProgress progress = kpiMapper.toProgressEntity(request);
                progress.setGoalItem(item);
                progress.setUpdatedBy(currentUser.getId());
                progressRepository.save(progress);

                // Update item status and snapshot value
                item.setActualValue(request.getActualValue());
                if (request.getProgressPercent().compareTo(new BigDecimal("100")) >= 0) {
                        item.setStatus(KpiItemStatus.COMPLETED);
                } else {
                        item.setStatus(KpiItemStatus.IN_PROGRESS);
                }
                goalItemRepository.save(item);

                return kpiMapper.toGoalSetResponse(item.getGoalSet());
        }

        @Transactional
        @Override
        public GoalSetResponse reviseKpi(Long itemId, KpiRevisionRequest request) {

                KpiGoalItem oldItem = goalItemRepository.findById(itemId)
                                .orElseThrow();

                KpiGoals oldGoalSet = oldItem.getGoalSet();

                // 1. lock old version
                oldGoalSet.setIsCurrent(false);
                oldGoalSet.setStatus(KpiGoalStatus.ARCHIVED);
                goalsRepository.save(oldGoalSet);

                // 2. create new version
                final KpiGoals savedGoalSet = goalsRepository.save(
                                KpiGoals.builder()
                                                .employee(oldGoalSet.getEmployee())
                                                .manager(oldGoalSet.getManager())
                                                .cycle(oldGoalSet.getCycle()) // fixed from test
                                                .version(oldGoalSet.getVersion() + 1)
                                                .isCurrent(true)
                                                .status(KpiGoalStatus.DRAFT)
                                                .build());

                // 3. copy items
                List<KpiGoalItem> newItems = oldGoalSet.getItems()
                                .stream()
                                .map(i -> {
                                        KpiGoalItem item = new KpiGoalItem();
                                        item.setGoalSet(savedGoalSet);
                                        item.setStatus(KpiItemStatus.NOT_STARTED);
                                        item.setIsActive(true);

                                        if (i.getId().equals(itemId)) {
                                                item.setTitle(request.getUpdatedDetails().getGoalTitle());
                                                item.setTargetValue(request.getUpdatedDetails().getTargetValue());
                                                item.setWeightPercent(request.getUpdatedDetails().getWeightPercent());
                                                item.setUnit(i.getUnit());
                                                item.setCategory(categoryRepository
                                                                .findById(request.getUpdatedDetails().getCategoryId())
                                                                .orElseThrow(() -> new NotFoundException(
                                                                                "Category not found")));
                                        } else {
                                                item.setTitle(i.getTitle());
                                                item.setTargetValue(i.getTargetValue());
                                                item.setWeightPercent(i.getWeightPercent());
                                                item.setUnit(i.getUnit());
                                                item.setCategory(i.getCategory());
                                                item.setActualValue(i.getActualValue());
                                                item.setStatus(i.getStatus());
                                        }
                                        return item;
                                })
                                .toList();

                List<KpiGoalItem> savedNewItems = goalItemRepository.saveAll(newItems);

                // 4. Carry over progress history for unchanged items
                for (int index = 0; index < oldGoalSet.getItems().size(); index++) {
                        KpiGoalItem oldItemEntity = oldGoalSet.getItems().get(index);
                        KpiGoalItem newItemEntity = savedNewItems.get(index);

                        // If this item was NOT the one revised, copy its progress history
                        if (!oldItemEntity.getId().equals(itemId)) {
                                List<KpiProgress> oldProgress = progressRepository
                                                .findByGoalItemIdOrderByIdDesc(oldItemEntity.getId());
                                List<KpiProgress> clonedProgress = oldProgress.stream().map(op -> {
                                        return KpiProgress.builder()
                                                        .goalItem(newItemEntity)
                                                        .actualValue(op.getActualValue())
                                                        .progressPercent(op.getProgressPercent())
                                                        .evidenceNote(op.getEvidenceNote())
                                                        .updatedBy(op.getUpdatedBy())
                                                        .build();
                                }).collect(Collectors.toList());
                                progressRepository.saveAll(clonedProgress);
                        }
                }

                // 5. history log
                historyRepo.save(
                                KpiHistoryLog.builder()
                                                .employeeId(oldGoalSet.getEmployee().getId())
                                                .oldVersionId(oldGoalSet.getId())
                                                .newVersionId(savedGoalSet.getId())
                                                .action("REVISION")
                                                .changeReason(request.getChangeReason())
                                                .changedBy(oldGoalSet.getManager().getId())
                                                .build());

                return kpiMapper.toGoalSetResponse(savedGoalSet);
        }

        @Override
        @Transactional
        public KpiScoreResponse calculateFinalScore(Long employeeId, Long cycleId) {
                KpiGoals goalSet = goalsRepository
                                .findByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(employeeId, cycleId)
                                .orElseThrow(() -> new NotFoundException("Current goal set not found"));

                Employee currentUser = getCurrentEmployee();

                // HR and ADMIN can calculate score for anyone
                boolean isHrOrAdmin = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                                .anyMatch(a -> a.getAuthority().equals("ROLE_HR")
                                                || a.getAuthority().equals("ROLE_ADMIN"));

                if (!isHrOrAdmin) {
                        // If Manager, must be the assigned manager for this goal set
                        if (!goalSet.getManager().getId().equals(currentUser.getId())) {
                                throw new SecurityException(
                                                "You are not authorized to calculate or view scores for this employee");
                        }
                }

                List<KpiGoalItem> items = goalItemRepository.findByGoalSetIdAndIsActiveTrue(goalSet.getId());

                BigDecimal totalWeightedScore = BigDecimal.ZERO;

                for (KpiGoalItem item : items) {
                        List<KpiProgress> progressList = progressRepository.findByGoalItemIdOrderByIdDesc(item.getId());
                        BigDecimal latestActual = progressList.isEmpty() ? BigDecimal.ZERO
                                        : progressList.get(0).getActualValue();

                        BigDecimal score = BigDecimal.ZERO;
                        if (item.getTargetValue() != null && item.getTargetValue().compareTo(BigDecimal.ZERO) != 0) {
                                // Score = (Actual / Target) * 100
                                score = latestActual.divide(item.getTargetValue(), 4, RoundingMode.HALF_UP)
                                                .multiply(new BigDecimal("100"));
                        }

                        // Weighted Score = Score * (Weight / 100)
                        BigDecimal weightedScore = score
                                        .multiply(item.getWeightPercent().divide(new BigDecimal("100"), 4,
                                                        RoundingMode.HALF_UP));

                        totalWeightedScore = totalWeightedScore.add(weightedScore);
                }

                KpiFinalScore finalScore = finalScoreRepository.findByEmployeeIdAndCycleId(employeeId, cycleId)
                                .orElse(new KpiFinalScore());

                finalScore.setEmployee(goalSet.getEmployee());
                finalScore.setGoalSet(goalSet);
                // finalScore.setCycle(goalSet.getCycle());
                finalScore.setWeightedScore(totalWeightedScore);
                finalScore.setTotalAchievementPercent(totalWeightedScore);
                finalScore.setCalculatedAt(Instant.now());
                finalScore.setFinalizedBy(getCurrentEmployee().getId());

                KpiFinalScore savedScore = finalScoreRepository.save(finalScore);

                // Log Audit
                auditService.log(AuditRequest.builder()
                                .tableName("kpi_final_score")
                                .recordId(savedScore.getId())
                                .action(savedScore.getId() == null ? AuditAction.INSERT : AuditAction.UPDATE)
                                .newState(savedScore)
                                .status(AuditStatus.SUCCESS)
                                .build());

                return kpiMapper.toScoreResponse(savedScore);
        }

        @Override
        public GoalSetResponse getGoalSetByEmployee(Long employeeId, Long cycleId) {
                return goalsRepository.findByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(employeeId, cycleId)
                                .map(kpiMapper::toGoalSetResponse)
                                .orElseThrow(() -> new NotFoundException(
                                                "Current goal set not found for this employee and cycle"));
        }

        @Override
        public GoalSetResponse getGoalSetById(Long id) {
                return goalsRepository.findById(id)
                                .map(kpiMapper::toGoalSetResponse)
                                .orElseThrow(() -> new NotFoundException("Goal set not found with ID: " + id));
        }

        @Override
        public List<KpiProgressResponse> getRecentProgress(Long employeeId, int limit) {
                return progressRepository.findByGoalItemGoalSetEmployeeIdOrderByIdDesc(employeeId).stream()
                                .limit(limit)
                                .map(p -> KpiProgressResponse.builder()
                                                .id(p.getId())
                                                .goalItemId(p.getGoalItem().getId())
                                                .goalTitle(p.getGoalItem().getTitle())
                                                .actualValue(p.getActualValue())
                                                .progressPercent(p.getProgressPercent())
                                                .evidenceNote(p.getEvidenceNote())
                                                .updatedAt(p.getCreatedAt().toString())
                                                .build())
                                .collect(Collectors.toList());
        }

        private Employee getCurrentEmployee() {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                return employeeRepository.findByEmail(email)
                                .orElseThrow(() -> new NotFoundException("Current user not found"));
        }
}