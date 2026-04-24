package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.kpi.*;
import ace.org.epms_backend.enums.KpiGoalStatus;
import ace.org.epms_backend.enums.KpiItemStatus;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.KpiMapper;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.kpi.*;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.KpiService;
import lombok.RequiredArgsConstructor;
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
    private final KpiGoalItemRepository goalItemRepo;
    private final KpiGoalsRepository goalsRepo;
    private final KpiHistoryLogRepository historyRepo;

    @Override
    @Transactional
    public KpiLibraryResponse createLibrary(KpiLibraryRequest request) {
        // Validate total weight
        BigDecimal totalWeight = request.getDetails().stream()
                .map(KpiLibraryDetailRequest::getWeightPercent)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalWeight.compareTo(new BigDecimal("100")) != 0) {
            throw new IllegalArgumentException("Total weight must be 100%");
        }

        KpiLibrary library = kpiMapper.toLibraryEntity(request);
        library.setPosition(positionRepository.findById(request.getPositionId())
                .orElseThrow(() -> new NotFoundException("Position not found")));

        KpiLibrary savedLibrary = libraryRepository.save(library);

        List<KpiLibraryDetails> details = request.getDetails().stream().map(d -> {
            KpiLibraryDetails detail = kpiMapper.toLibraryDetailEntity(d);
            detail.setLibrary(savedLibrary);
            return detail;
        }).collect(Collectors.toList());

        libraryDetailsRepository.saveAll(details);
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
    @Transactional
    public GoalSetResponse assignKpiToEmployee(GoalAssignmentRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        KpiLibrary library = libraryRepository.findById(request.getLibraryId())
                .orElseThrow(() -> new NotFoundException("Library not found"));

        Employee currentManager = getCurrentEmployee();

        KpiGoals goalSet = KpiGoals.builder()
                .employee(employee)
                .manager(currentManager)
                .appraisalCycleId(request.getAppraisalCycleId())
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
                    .status(KpiItemStatus.NOT_STARTED)
                    .isActive(true)
                    .build();
        }).collect(Collectors.toList());

        goalItemRepository.saveAll(goalItems);

        return kpiMapper.toGoalSetResponse(savedGoalSet);
    }

    @Override
    @Transactional
    public GoalSetResponse approveGoalSet(Long goalSetId) {
        KpiGoals goalSet = goalsRepository.findById(goalSetId)
                .orElseThrow(() -> new NotFoundException("Goal set not found"));

        if (!goalSet.getStatus().equals(KpiGoalStatus.DRAFT)) {
            throw new IllegalStateException("Only DRAFT goals can be approved");
        }

        goalSet.setStatus(KpiGoalStatus.APPROVED);
        goalSet.setApprovedAt(Instant.now());
        goalSet.setApprovedBy(getCurrentEmployee().getId());
        KpiGoals savedGoalSet = goalsRepository.save(goalSet);
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

        // Update item status
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

        KpiGoalItem oldItem = goalItemRepo.findById(itemId)
                .orElseThrow();

        KpiGoals oldGoalSet = oldItem.getGoalSet();

        // 1. lock old version
        oldGoalSet.setIsCurrent(false);
        oldGoalSet.setStatus(KpiGoalStatus.ARCHIVED);
        goalsRepo.save(oldGoalSet);

        // 2. create new version
        final KpiGoals savedGoalSet = goalsRepo.save(
                KpiGoals.builder()
                        .employee(oldGoalSet.getEmployee())
                        .manager(oldGoalSet.getManager())
                        .appraisalCycleId(oldGoalSet.getAppraisalCycleId())
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
                    item.setTitle(i.getTitle());
                    item.setTargetValue(i.getTargetValue());
                    item.setWeightPercent(i.getWeightPercent());
                    item.setStatus(KpiItemStatus.NOT_STARTED);
                    return item;
                })
                .toList();

        goalItemRepo.saveAll(newItems);

        // 4. history log
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
        KpiGoals goalSet = goalsRepository.findByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(employeeId, cycleId)
                .orElseThrow(() -> new NotFoundException("Current goal set not found"));

        List<KpiGoalItem> items = goalItemRepository.findByGoalSetIdAndIsActiveTrue(goalSet.getId());

        BigDecimal totalWeightedScore = BigDecimal.ZERO;

        for (KpiGoalItem item : items) {
            List<KpiProgress> progressList = progressRepository.findByGoalItemIdOrderByIdDesc(item.getId());
            BigDecimal latestActual = progressList.isEmpty() ? BigDecimal.ZERO : progressList.get(0).getActualValue();

            BigDecimal score = BigDecimal.ZERO;
            if (item.getTargetValue() != null && item.getTargetValue().compareTo(BigDecimal.ZERO) != 0) {
                // Score = (Actual / Target) * 100
                score = latestActual.divide(item.getTargetValue(), 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"));
            }

            // Weighted Score = Score * (Weight / 100)
            BigDecimal weightedScore = score
                    .multiply(item.getWeightPercent().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));

            totalWeightedScore = totalWeightedScore.add(weightedScore);
        }

        KpiFinalScore finalScore = finalScoreRepository.findByEmployeeIdAndCycleId(employeeId, cycleId)
                .orElse(new KpiFinalScore());

        finalScore.setEmployee(goalSet.getEmployee());
        finalScore.setGoalSet(goalSet);
        finalScore.setCycleId(cycleId);
        finalScore.setWeightedScore(totalWeightedScore);
        finalScore.setCalculatedAt(Instant.now());
        finalScore.setFinalizedBy(getCurrentEmployee().getId());

        KpiFinalScore savedScore = finalScoreRepository.save(finalScore);
        return kpiMapper.toScoreResponse(savedScore);
    }

    private Employee getCurrentEmployee() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return employeeRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Current user not found"));
    }
}
