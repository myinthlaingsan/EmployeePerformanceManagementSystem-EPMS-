package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.feedback360.FeedbackRequestResponse;
import ace.org.epms_backend.dto.feedback360.FeedbackRequestGenerateDTO;
import ace.org.epms_backend.dto.feedback360.GenerationValidationResponse;
import ace.org.epms_backend.dto.feedback360.PendingFeedbackDTO;
import ace.org.epms_backend.enums.FeedbackRelationship;
import ace.org.epms_backend.enums.FeedbackStatus;
import ace.org.epms_backend.enums.FormType;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;
import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.FeedbackMapper;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.appraisal.AppraisalForm;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.ReportingLine;
import ace.org.epms_backend.model.feedback360.FeedbackRequest;
import ace.org.epms_backend.model.feedback360.DepartmentFeedbackConfig;
import ace.org.epms_backend.model.feedback360.GlobalFeedbackConfig;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.AppraisalCycleRepository;
import ace.org.epms_backend.repository.EmployeeDepartmentRepository;
import ace.org.epms_backend.repository.employee.EmployeeTeamRepository;
import ace.org.epms_backend.repository.employee.ReportingLineRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackRequestRepository;
import ace.org.epms_backend.repository.feedback360.DepartmentFeedbackConfigRepository;
import ace.org.epms_backend.repository.feedback360.GlobalFeedbackConfigRepository;
import ace.org.epms_backend.repository.AppraisalFormRepository;
import ace.org.epms_backend.service.feedback360.FeedbackRequestService;
import ace.org.epms_backend.service.feedback360.EvaluatorRotationService;
import ace.org.epms_backend.service.feedback360.FeedbackFormResolverService;
import ace.org.epms_backend.service.feedback360.ManagerAssignmentService;
import ace.org.epms_backend.service.feedback360.PeerRandomizationService;
import ace.org.epms_backend.service.feedback360.SubordinateRandomizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
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
    private final EvaluatorRotationService evaluatorRotationService;
    private final DepartmentFeedbackConfigRepository deptConfigRepository;
    private final AppraisalFormRepository formRepository;
    private final GlobalFeedbackConfigRepository globalConfigRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final FeedbackFormResolverService formResolverService;
    private final ManagerAssignmentService managerAssignmentService;
    private final PeerRandomizationService peerRandomizationService;
    private final SubordinateRandomizationService subordinateRandomizationService;

    @Override
    @Transactional
    public void generate360FeedbackRequests(Long cycleId, Long previousCycleId, int globalMaxLimit, boolean excludeLongTermLeave) {
        AppraisalCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new NotFoundException("Cycle not found"));
        
        if (cycle.getStatus() != ace.org.epms_backend.enums.CycleStatus.FINALIZED) {
            throw new IllegalStateException("Evaluator list must be Finalized before generating requests. Current status: " + cycle.getStatus());
        }

        process360Generation(cycleId, previousCycleId, globalMaxLimit, true, excludeLongTermLeave);
        
        cycle.setStatus(ace.org.epms_backend.enums.CycleStatus.GENERATED);
        cycleRepository.save(cycle);
    }

    @Override
    public List<FeedbackRequestResponse> preview360FeedbackRequests(Long cycleId, Long previousCycleId, int globalMaxLimit, boolean excludeLongTermLeave) {
        List<FeedbackRequestResponse> preview = process360Generation(cycleId, previousCycleId, globalMaxLimit, false, excludeLongTermLeave);
        preview.sort(Comparator.comparing(r -> r.getTargetDepartmentName() != null ? r.getTargetDepartmentName() : ""));
        return preview;
    }

    @Override
    @Transactional
    public void finalizeEvaluators(Long cycleId) {
        if (!cycleRepository.existsById(cycleId)) {
            throw new NotFoundException("Cycle not found");
        }
        cycleRepository.updateStatus(cycleId, ace.org.epms_backend.enums.CycleStatus.FINALIZED);
    }

    @Override
    @Transactional
    public void regenerateAll(Long cycleId, Long previousCycleId, int globalMaxLimit, boolean excludeLongTermLeave) {
        AppraisalCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new NotFoundException("Cycle not found"));
        requestRepository.deleteByCycleCycleIdAndStatus(cycleId, FeedbackStatus.PENDING);
        process360Generation(cycleId, previousCycleId, globalMaxLimit, true, excludeLongTermLeave);
    }

    @Override
    public GenerationValidationResponse validate360Generation(Long cycleId, boolean excludeLongTermLeave) {
        List<Employee> allEmployees = employeeRepository.findAll().stream()
                .filter(e -> getLevelRank(e) < 8)
                .filter(e -> !excludeLongTermLeave || e.getStatus() != ace.org.epms_backend.enums.EmployeeStatus.LONG_TERM_LEAVE)
                .filter(e -> e.getStatus() != ace.org.epms_backend.enums.EmployeeStatus.RESIGNED)
                .collect(Collectors.toList());

        Map<String, DepartmentFeedbackConfig> deptConfigs = deptConfigRepository.findAll().stream()
                .filter(c -> c.getDepartment() != null && c.getJobLevel() != null)
                .collect(Collectors.toMap(c -> c.getDepartment().getId() + ":" + c.getJobLevel().getLevelId(), c -> c, (a, b) -> a));

        GlobalFeedbackConfig globalConfig = globalConfigRepository.findFirstByIsActiveTrue().orElse(new GlobalFeedbackConfig());
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        AppraisalCycle cycle = cycleRepository.findById(cycleId).orElse(null);
        if (cycle != null) {
            boolean hasForm = formRepository.existsByCycleCycleIdAndFormType(cycleId, FormType.FEEDBACK);
            if (!hasForm) {
                errors.add("Configuration Error: No 360 Feedback form is defined for cycle '" + cycle.getCycleName() + "'. Please save a form in the Form Builder first.");
            }
        } else {
            errors.add("Error: Appraisal cycle not found.");
        }

        for (Employee target : allEmployees) {
            if (getLevelRank(target) < 4) continue;
            Long deptId = getDeptId(target);
            DepartmentFeedbackConfig config = (deptId != null && target.getLevel() != null) ? deptConfigs.get(deptId + ":" + target.getLevel().getLevelId()) : null;

            int reqPeers = (config != null && config.getMaxPeers() != null) ? config.getMaxPeers() : globalConfig.getDefaultMaxPeers();
            int reqSubs = (config != null && config.getMaxSubordinates() != null) ? config.getMaxSubordinates() : globalConfig.getDefaultMaxSubordinates();

            if (reqPeers > 0) {
                int availablePeers = peerRandomizationService.selectPeers(target, 999, Collections.emptySet()).size();
                if (availablePeers < reqPeers) {
                    String deptName = getDeptName(target);
                    warnings.add(String.format("%s (%s): Peers available (%d) < Limit (%d)", target.getStaffName(), deptName, availablePeers, reqPeers));
                }
            }
            if (reqSubs > 0) {
                int availableSubs = subordinateRandomizationService.selectSubordinates(target, 999, Collections.emptySet()).size();
                if (availableSubs < reqSubs) {
                    String deptName = getDeptName(target);
                    warnings.add(String.format("%s (%s): Subordinates available (%d) < Limit (%d)", target.getStaffName(), deptName, availableSubs, reqSubs));
                }
            }
        }
        return GenerationValidationResponse.builder()
                .isValid(errors.isEmpty())
                .warnings(warnings)
                .errors(errors)
                .build();
    }

    private List<FeedbackRequestResponse> process360Generation(Long cycleId, Long previousCycleId, int globalMaxLimit, boolean persist, boolean excludeLongTermLeave) {
        AppraisalCycle cycle = cycleRepository.findById(cycleId).orElseThrow(() -> new NotFoundException("Cycle not found"));
        List<FeedbackRequestResponse> previewResults = new ArrayList<>();
        Map<Long, Integer> workloadMap = new HashMap<>();

        Map<String, DepartmentFeedbackConfig> deptConfigs = deptConfigRepository.findAll().stream()
                .filter(c -> c.getDepartment() != null && c.getJobLevel() != null)
                .collect(Collectors.toMap(c -> c.getDepartment().getId() + ":" + c.getJobLevel().getLevelId(), c -> c, (a, b) -> a));

        List<Employee> allEmployees = employeeRepository.findAll().stream()
                .filter(e -> getLevelRank(e) < 8)
                .filter(e -> !excludeLongTermLeave || e.getStatus() != ace.org.epms_backend.enums.EmployeeStatus.LONG_TERM_LEAVE)
                .filter(e -> e.getStatus() != ace.org.epms_backend.enums.EmployeeStatus.RESIGNED)
                .collect(Collectors.toList());

        Map<Long, Set<Long>> excludedEvaluatorsMap = new HashMap<>();
        if (previousCycleId != null) {
            requestRepository.findByCycleCycleId(previousCycleId).forEach(req -> excludedEvaluatorsMap.computeIfAbsent(req.getTargetUser().getId(), k -> new HashSet<>()).add(req.getEvaluator().getId()));
        }

        AppraisalForm defaultForm = cycle.getForms().stream().filter(f -> f.getFormType() == FormType.FEEDBACK).findFirst().orElse(null);
        if (defaultForm == null) {
            throw new IllegalStateException("No 360 Feedback form has been configured for this cycle. Please setup the form in the Form Builder first.");
        }

        for (Employee target : allEmployees) {
            generateRequestsForEmployee(cycle, target, cycleId, previousCycleId, globalMaxLimit, workloadMap, deptConfigs, persist, previewResults, excludedEvaluatorsMap);
        }
        return previewResults;
    }

    private void generateRequestsForEmployee(AppraisalCycle cycle, Employee target, Long cycleId, Long previousCycleId, int globalMaxLimit, Map<Long, Integer> workloadMap, Map<String, DepartmentFeedbackConfig> deptConfigs, boolean persist, List<FeedbackRequestResponse> previewResults, Map<Long, Set<Long>> excludedEvaluatorsMap) {
        int rank = getLevelRank(target);
        if (rank < 4) return;

        Set<Long> excluded = excludedEvaluatorsMap.getOrDefault(target.getId(), Collections.emptySet());
        Long deptId = getDeptId(target);
        DepartmentFeedbackConfig config = (deptId != null && target.getLevel() != null) ? deptConfigs.get(deptId + ":" + target.getLevel().getLevelId()) : null;
        GlobalFeedbackConfig globalConfig = globalConfigRepository.findFirstByIsActiveTrue().orElse(new GlobalFeedbackConfig());

        int maxPeers = (config != null && config.getMaxPeers() != null) ? config.getMaxPeers() : globalConfig.getDefaultMaxPeers();
        int maxSubs = (config != null && config.getMaxSubordinates() != null) ? config.getMaxSubordinates() : globalConfig.getDefaultMaxSubordinates();

        // 1. SELF Feedback
        handleRequest(cycle, target, target, FeedbackRelationship.SELF, workloadMap, 999, persist, previewResults, true, maxPeers, maxSubs);

        // 2. MANAGER Feedback (Fixed, strict rank check + fallback via ManagerAssignmentService)
        Optional<Employee> directManager = managerAssignmentService.getDirectManager(target);
        boolean managerAssigned = false;
        if (directManager.isPresent()) {
            managerAssigned = handleRequest(cycle, target, directManager.get(), FeedbackRelationship.MANAGER, workloadMap, 10, persist, previewResults, true, maxPeers, maxSubs);
        }

        // If primary manager is overloaded (workload >= 10) or not found, find an Alternate Manager in the same Dept/Team
        if (!managerAssigned && rank > 4) {
            Optional<Employee> alternateManager = findAlternateManager(target, workloadMap, 10);
            alternateManager.ifPresent(altManager -> {
                handleRequest(cycle, target, altManager, FeedbackRelationship.MANAGER, workloadMap, 10, persist, previewResults, true, maxPeers, maxSubs);
            });
        }

        // 3. PEER Feedback (Randomized, using PeerRandomizationService)
        List<Employee> selectedPeers = peerRandomizationService.selectPeers(target, maxPeers, excluded);
        int pCount = 0;
        // First pass: try to assign without reciprocal evaluations
        for (Employee p : selectedPeers) {
            if (pCount >= maxPeers) break;
            if (handleRequest(cycle, target, p, FeedbackRelationship.PEER, workloadMap, globalMaxLimit, persist, previewResults, false, maxPeers, maxSubs)) {
                pCount++;
            }
        }
        // Second pass: fallback if quota not met, allow reciprocity
        if (pCount < maxPeers) {
            for (Employee p : selectedPeers) {
                if (pCount >= maxPeers) break;
                if (handleRequest(cycle, target, p, FeedbackRelationship.PEER, workloadMap, globalMaxLimit, persist, previewResults, true, maxPeers, maxSubs)) {
                    pCount++;
                }
            }
        }

        // 4. SUBORDINATE Feedback (Randomized, using SubordinateRandomizationService)
        if (maxSubs > 0) {
            List<Employee> selectedSubs = subordinateRandomizationService.selectSubordinates(target, maxSubs, excluded);
            int sCount = 0;
            for (Employee s : selectedSubs) {
                if (sCount >= maxSubs) break;
                if (handleRequest(cycle, target, s, FeedbackRelationship.SUBORDINATE, workloadMap, globalMaxLimit, persist, previewResults, true, maxPeers, maxSubs)) {
                    sCount++;
                }
            }
        }
    }

    private Long getDeptId(Employee e) {
        return departmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(e.getId()).map(ed -> ed.getCurrentDepartment() != null ? ed.getCurrentDepartment().getId() : null).orElse(null);
    }

    private String getDeptName(Employee e) {
        return departmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(e.getId())
                .map(ed -> ed.getCurrentDepartment() != null ? ed.getCurrentDepartment().getDepartmentName() : "N/A")
                .orElse("N/A");
    }

    private boolean handleRequest(AppraisalCycle cycle, Employee target, Employee evaluator, FeedbackRelationship rel, Map<Long, Integer> workloadMap, int limit, boolean persist, List<FeedbackRequestResponse> previewResults, boolean allowReciprocal, Integer pLimit, Integer sLimit) {
        if (target == null || evaluator == null) return false;
        if (target.getId().equals(evaluator.getId()) && rel != FeedbackRelationship.SELF) return false;
        int currentWorkload = workloadMap.getOrDefault(evaluator.getId(), 0);
        if (currentWorkload >= limit) return false;

        boolean isReciprocal = persist ? requestRepository.existsByTargetUserIdAndEvaluatorIdAndCycleCycleId(evaluator.getId(), target.getId(), cycle.getCycleId())
                : previewResults.stream().anyMatch(r -> r.getTargetUserId().equals(evaluator.getId()) && r.getEvaluatorId().equals(target.getId()));
        if (isReciprocal && !allowReciprocal && rel == FeedbackRelationship.PEER) return false;

        boolean anon = isAnonymous(rel);
        AppraisalForm resolvedForm = formResolverService.resolveForm(target, rel, cycle.getCycleId());

        if (!persist) {
            if (previewResults.stream().anyMatch(r -> r.getTargetUserId().equals(target.getId()) && r.getEvaluatorId().equals(evaluator.getId()))) return false;
            
            String targetDept = departmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(target.getId()).map(d -> d.getCurrentDepartment() != null ? d.getCurrentDepartment().getDepartmentName() : "N/A").orElse("N/A");
            String evalDept = departmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(evaluator.getId()).map(d -> d.getCurrentDepartment() != null ? d.getCurrentDepartment().getDepartmentName() : "N/A").orElse("N/A");
            String targetLevel = getEmployeeLevelCode(target);
            String evalLevel = getEmployeeLevelCode(evaluator);
            
            previewResults.add(FeedbackRequestResponse.builder()
                .targetUserId(target.getId())
                .targetUserName(target.getStaffName())
                .targetDepartmentName(targetDept)
                .targetLevelCode(targetLevel)
                .evaluatorId(evaluator.getId())
                .evaluatorName(evaluator.getStaffName())
                .evaluatorDepartmentName(evalDept)
                .evaluatorLevelCode(evalLevel)
                .relationship(rel)
                .status(FeedbackStatus.PENDING)
                .isAnonymous(anon)
                .isReciprocalFallback(isReciprocal)
                .build());
                
            workloadMap.put(evaluator.getId(), currentWorkload + 1);
            return true;
        }
        return createRequest(cycle, target, evaluator, rel, anon, workloadMap, limit, isReciprocal, resolvedForm, pLimit, sLimit);
    }

    private boolean createRequest(AppraisalCycle cycle, Employee target, Employee evaluator, FeedbackRelationship rel, boolean anon, Map<Long, Integer> workloadMap, int limit, boolean isFallback, AppraisalForm form, Integer pLimit, Integer sLimit) {
        if (target == null || evaluator == null || cycle == null) return false;
        int currentWorkload = workloadMap.getOrDefault(evaluator.getId(), 0);
        if (currentWorkload >= limit) return false;

        Optional<FeedbackRequest> existing = requestRepository.findByTargetUserIdAndEvaluatorIdAndCycleCycleId(target.getId(), evaluator.getId(), cycle.getCycleId());
        if (existing.isPresent()) {
            FeedbackRequest req = existing.get();
            if (req.getAssignedForm() == null && form != null) {
                req.setAssignedForm(form); req.setPeerLimitSnapshot(pLimit); req.setSubordinateLimitSnapshot(sLimit);
                requestRepository.save(req);
            }
            return false;
        }

        FeedbackRequest request = FeedbackRequest.builder().targetUser(target).evaluator(evaluator).cycle(cycle).relationship(rel).assignedForm(form).isAnonymous(anon).status(FeedbackStatus.PENDING).peerLimitSnapshot(pLimit).subordinateLimitSnapshot(sLimit).build();
        FeedbackRequest savedRequest = requestRepository.save(request);
        workloadMap.put(evaluator.getId(), currentWorkload + 1);
        eventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(evaluator.getId())
                .type(NotificationType.FEEDBACK_REQUESTED)
                .title("Feedback Requested")
                .message("You have been requested to provide 360 feedback for " + (anon ? "a colleague" : target.getStaffName()) + ".")
                .referenceType(ReferenceType.FEEDBACK)
                .referenceId(savedRequest.getId())
                .actionUrl("/feedback/my-pending")
                .build());
        return true;
    }

    @Override
    @Transactional
    public void generateRequests(FeedbackRequestGenerateDTO dto) {
        AppraisalCycle cycle = cycleRepository.findById(dto.getCycleId()).orElseThrow(() -> new NotFoundException("Cycle not found"));
        Map<Long, Integer> workloadMap = new HashMap<>();
        for (Long eid : dto.getEmployeeIds()) {
            Employee target = employeeRepository.findById(eid).orElseThrow(() -> new NotFoundException("Employee not found"));
            
            // Resolve forms dynamically per relationship
            AppraisalForm selfForm = formResolverService.resolveForm(target, FeedbackRelationship.SELF, cycle.getCycleId());
            createRequest(cycle, target, target, FeedbackRelationship.SELF, false, workloadMap, 999, false, selfForm, null, null);
            
            // Manager Assignment (Using Decoupled robust ManagerAssignmentService)
            Optional<Employee> directManager = managerAssignmentService.getDirectManager(target);
            directManager.ifPresent(manager -> {
                AppraisalForm managerForm = formResolverService.resolveForm(target, FeedbackRelationship.MANAGER, cycle.getCycleId());
                createRequest(cycle, target, manager, FeedbackRelationship.MANAGER, false, workloadMap, 10, false, managerForm, null, null);
            });
            
            // Peer Assignment (Using Decoupled robust PeerRandomizationService)
            List<Employee> peers = peerRandomizationService.selectPeers(target, dto.getPeerLimit(), Collections.emptySet());
            int pCount = 0; 
            AppraisalForm peerForm = formResolverService.resolveForm(target, FeedbackRelationship.PEER, cycle.getCycleId());
            for (Employee p : peers) { 
                if (pCount >= dto.getPeerLimit()) break; 
                if (createRequest(cycle, target, p, FeedbackRelationship.PEER, true, workloadMap, 99, false, peerForm, dto.getPeerLimit(), 0)) pCount++; 
            }
            
            // Subordinate Assignment (Using Decoupled robust SubordinateRandomizationService)
            if (Boolean.TRUE.equals(dto.getIncludeSubordinates())) {
                List<Employee> subs = subordinateRandomizationService.selectSubordinates(target, 99, Collections.emptySet());
                AppraisalForm subForm = formResolverService.resolveForm(target, FeedbackRelationship.SUBORDINATE, cycle.getCycleId());
                for (Employee s : subs) {
                    createRequest(cycle, target, s, FeedbackRelationship.SUBORDINATE, true, workloadMap, 99, false, subForm, 0, 0);
                }
            }
        }
    }

    private boolean isAnonymous(FeedbackRelationship relationship) {
        return relationship == FeedbackRelationship.PEER || relationship == FeedbackRelationship.SUBORDINATE;
    }

    private int getLevelRank(Employee employee) {
        return (employee.getLevel() != null && employee.getLevel().getLevelRank() != null) ? employee.getLevel().getLevelRank() : 99;
    }

    private Optional<Employee> findAlternateManager(Employee target, Map<Long, Integer> workloadMap, int limit) {
        int expectedRank = getLevelRank(target) - 1;
        Long deptId = getDeptId(target);
        
        // 1. Look for alternate managers in the same Department who haven't hit their workload limit
        if (deptId != null) {
            List<Employee> deptAlternates = departmentRepository.findByCurrentDepartmentIdAndIsCurrentTrue(deptId)
                .stream()
                .map(ace.org.epms_backend.model.employee.EmployeeDepartment::getEmployee)
                .filter(e -> e != null 
                        && getLevelRank(e) == expectedRank 
                        && e.getStatus() == ace.org.epms_backend.enums.EmployeeStatus.ACTIVE
                        && workloadMap.getOrDefault(e.getId(), 0) < limit)
                .collect(Collectors.toList());
            if (!deptAlternates.isEmpty()) {
                log.info("Alternate Manager Fallback: Assigned {} from department for target {}", deptAlternates.get(0).getStaffName(), target.getStaffName());
                return Optional.of(deptAlternates.get(0));
            }
        }
        
        // 2. Look for alternate managers in the same Team who haven't hit their workload limit
        Optional<Employee> teamAlternate = teamRepository.findFirstByEmployeeIdAndIsPrimaryTrue(target.getId())
            .flatMap(et -> {
                if (et.getTeam() == null) return Optional.empty();
                return teamRepository.findByTeamTeamId(et.getTeam().getTeamId())
                    .stream()
                    .map(ace.org.epms_backend.model.employee.EmployeeTeam::getEmployee)
                    .filter(e -> e != null 
                            && getLevelRank(e) == expectedRank 
                            && e.getStatus() == ace.org.epms_backend.enums.EmployeeStatus.ACTIVE
                            && workloadMap.getOrDefault(e.getId(), 0) < limit)
                    .findFirst();
            });
            
        if (teamAlternate.isPresent()) {
            log.info("Alternate Manager Fallback: Assigned {} from team for target {}", teamAlternate.get().getStaffName(), target.getStaffName());
        }
        return teamAlternate;
    }

    @Override
    public List<FeedbackRequestResponse> getMyPendingRequests(Long evaluatorId) {
        return requestRepository.findByEvaluatorIdAndStatus(evaluatorId, FeedbackStatus.PENDING).stream().map(feedbackMapper::toRequestResponse).collect(Collectors.toList());
    }

    @Override
    public FeedbackRequestResponse getRequest(Long requestId) {
        return requestRepository.findById(requestId).map(feedbackMapper::toRequestResponse).orElseThrow(() -> new NotFoundException("Request not found"));
    }

    @Override
    @Transactional
    public void regenerateUserFeedbackRequests(Long targetEmployeeId, Long cycleId, Long previousCycleId, int globalMaxLimit) {
        AppraisalCycle cycle = cycleRepository.findById(cycleId).orElseThrow(() -> new NotFoundException("Cycle not found"));
        Employee target = employeeRepository.findById(targetEmployeeId).orElseThrow(() -> new NotFoundException("Employee not found"));
        requestRepository.deleteByTargetUserIdAndCycleCycleIdAndStatus(targetEmployeeId, cycleId, FeedbackStatus.PENDING);
        Map<Long, Integer> workloadMap = new HashMap<>();
        requestRepository.findByCycleCycleId(cycleId).forEach(req -> workloadMap.put(req.getEvaluator().getId(), workloadMap.getOrDefault(req.getEvaluator().getId(), 0) + 1));
        Map<String, DepartmentFeedbackConfig> deptConfigs = deptConfigRepository.findAll().stream().filter(c -> c.getDepartment() != null && c.getJobLevel() != null).collect(Collectors.toMap(c -> c.getDepartment().getId() + ":" + c.getJobLevel().getLevelId(), c -> c, (a, b) -> a));
        Map<Long, Set<Long>> excluded = new HashMap<>();
        if (previousCycleId != null) requestRepository.findByCycleCycleId(previousCycleId).forEach(req -> excluded.computeIfAbsent(req.getTargetUser().getId(), k -> new HashSet<>()).add(req.getEvaluator().getId()));
        generateRequestsForEmployee(cycle, target, cycleId, previousCycleId, globalMaxLimit, workloadMap, deptConfigs, true, new ArrayList<>(), excluded);
    }

    @Override
    public List<FeedbackRequestResponse> getRequestsByEmployee(Long targetEmployeeId, Long cycleId) {
        return requestRepository.findByTargetUserIdAndCycleCycleId(targetEmployeeId, cycleId)
                .stream()
                .map(feedbackMapper::toRequestResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<FeedbackRequestResponse> getRequestsByCycle(Long cycleId) {
        return requestRepository.findByCycleCycleId(cycleId)
                .stream()
                .map(feedbackMapper::toRequestResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Long> getRequestStatusCountByCycle(Long cycleId) {
        return requestRepository.findByCycleCycleId(cycleId)
                .stream()
                .collect(Collectors.groupingBy(
                        r -> r.getStatus().name(),
                        Collectors.counting()
                ));
    }

    private String getEmployeeLevelCode(Employee employee) {
        if (employee == null) return "N/A";
        if (employee.getLevel() != null && employee.getLevel().getLevelCode() != null) {
            return employee.getLevel().getLevelCode();
        }
        if (employee.getPosition() != null && employee.getPosition().getLevel() != null && employee.getPosition().getLevel().getLevelCode() != null) {
            return employee.getPosition().getLevel().getLevelCode();
        }
        return "N/A";
    }

    @Override
    @Transactional
    public void resetCycleStatus(Long cycleId) {
        AppraisalCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new NotFoundException("Cycle not found"));
        
        // Delete all pending requests for this cycle
        requestRepository.deleteByCycleCycleIdAndStatus(cycleId, FeedbackStatus.PENDING);
        
        // Reset status to PLANNING
        cycle.setStatus(ace.org.epms_backend.enums.CycleStatus.PLANNING);
        cycleRepository.save(cycle);
    }

    @Override
    public List<PendingFeedbackDTO> getAllPendingFeedbacks() {
        return requestRepository.findByStatus(FeedbackStatus.PENDING)
                .stream()
                .map(req -> PendingFeedbackDTO.builder()
                        .requestId(req.getId())
                        .evaluatorId(req.getEvaluator().getId())
                        .evaluatorName(req.getEvaluator().getStaffName())
                        .evaluatorDepartmentName(getDeptName(req.getEvaluator()))
                        .targetUserId(req.getTargetUser().getId())
                        .targetUserName(req.getTargetUser().getStaffName())
                        .targetDepartmentName(getDeptName(req.getTargetUser()))
                        .cycleId(req.getCycle().getCycleId())
                        .cycleName(req.getCycle().getCycleName())
                        .cycleEndDate(req.getCycle().getEndDate())
                        .relationship(req.getRelationship() != null ? req.getRelationship().toEvaluatorPerspective() : null)
                        .isAnonymous(req.getIsAnonymous())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void sendReminder(Long requestId) {
        FeedbackRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Feedback request not found"));

        if (request.getStatus() != FeedbackStatus.PENDING) {
            throw new IllegalStateException("Can only send reminders for pending requests.");
        }

        eventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(request.getEvaluator().getId())
                .type(NotificationType.FEEDBACK_REMINDER)
                .title("Feedback Reminder")
                .message("Reminder: You have a pending 360 feedback request for " + request.getTargetUser().getStaffName() + ".")
                .referenceType(ReferenceType.FEEDBACK)
                .referenceId(request.getId())
                .actionUrl("/feedback360")
                .build());
    }

    @Override
    @Transactional
    public void sendRemindersToAll(Long cycleId) {
        List<FeedbackRequest> pendingRequests;
        if (cycleId != null) {
            pendingRequests = requestRepository.findByCycleCycleIdAndStatus(cycleId, FeedbackStatus.PENDING);
        } else {
            pendingRequests = requestRepository.findByStatus(FeedbackStatus.PENDING);
        }

        for (FeedbackRequest request : pendingRequests) {
            eventPublisher.publishEvent(NotificationEvent.builder()
                    .recipientId(request.getEvaluator().getId())
                    .type(NotificationType.FEEDBACK_REMINDER)
                    .title("Feedback Reminder")
                    .message("Reminder: You have a pending 360 feedback request for " + request.getTargetUser().getStaffName() + ".")
                    .referenceType(ReferenceType.FEEDBACK)
                    .referenceId(request.getId())
                    .actionUrl("/feedback360")
                    .build());
        }
    }
}
