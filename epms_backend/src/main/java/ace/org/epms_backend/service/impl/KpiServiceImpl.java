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
    private final KpiHistoryLogRepository historyLogRepository;
    private final KpiFinalScoreRepository finalScoreRepository;
    private final EmployeeRepository employeeRepository;
    private final PositionRepository positionRepository;
    private final KpiMapper kpiMapper;

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
    public void toggleLibraryStatus(Long id, boolean status) {
        KpiLibrary library = libraryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Library not found"));
        library.setIsActive(status);
        libraryRepository.save(library);
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
    public void approveGoalSet(Long goalSetId) {
        KpiGoals goalSet = goalsRepository.findById(goalSetId)
                .orElseThrow(() -> new NotFoundException("Goal set not found"));
        
        goalSet.setStatus(KpiGoalStatus.APPROVED);
        goalSet.setApprovedAt(Instant.now());
        goalSet.setApprovedBy(getCurrentEmployee().getId());
        goalsRepository.save(goalSet);
    }

    @Override
    @Transactional
    public void updateProgress(ProgressRequest request) {
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
    }

    @Override
    @Transactional
    public void reviseKpi(Long goalItemId, KpiRevisionRequest request) {
        KpiGoalItem item = goalItemRepository.findById(goalItemId)
                .orElseThrow(() -> new NotFoundException("Goal item not found"));

        Employee currentUser = getCurrentEmployee();
        // Log history before update
        KpiHistoryLog log = KpiHistoryLog.builder()
                .employeeId(item.getGoalSet().getEmployee().getId())
                .oldVersionId(item.getId())
                .action("REVISE")
                .changeReason(request.getChangeReason())
                .changedBy(currentUser.getId())
                .build();
        historyLogRepository.save(log);

        // Update item
        item.setTitle(request.getUpdatedDetails().getGoalTitle());
        item.setTargetValue(request.getUpdatedDetails().getTargetValue());
        item.setWeightPercent(request.getUpdatedDetails().getWeightPercent());
        
        goalItemRepository.save(item);
    }

    @Override
    @Transactional
    public void calculateFinalScore(Long employeeId, Long cycleId) {
        KpiGoals goalSet = goalsRepository.findByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(employeeId, cycleId)
                .orElseThrow(() -> new NotFoundException("Current goal set not found"));

        List<KpiGoalItem> items = goalItemRepository.findByGoalSetIdAndIsActiveTrue(goalSet.getId());
        
        BigDecimal totalWeightedScore = BigDecimal.ZERO;

        for (KpiGoalItem item : items) {
            List<KpiProgress> progressList = progressRepository.findByGoalItemIdOrderByIdDesc(item.getId());
            BigDecimal latestActual = progressList.isEmpty() ? BigDecimal.ZERO : progressList.get(0).getActualValue();
            
            // Score = (Actual / Target) * 100
            BigDecimal score = latestActual.divide(item.getTargetValue(), 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"));
            
            // Weighted Score = Score * (Weight / 100)
            BigDecimal weightedScore = score.multiply(item.getWeightPercent().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
            
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

        finalScoreRepository.save(finalScore);
    }

    private Employee getCurrentEmployee() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return employeeRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Current user not found"));
    }
}
