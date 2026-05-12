package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.feedback360.FeedbackRequestResponse;
import ace.org.epms_backend.dto.feedback360.FeedbackRequestGenerateDTO;
import ace.org.epms_backend.dto.feedback360.GenerationValidationResponse;
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
            boolean hasForm = cycle.getForms().stream().anyMatch(f -> f.getFormType() == FormType.FEEDBACK);
            if (!hasForm) {
                errors.add("Configuration Error: No 360 Feedback form is defined for this cycle.");
            }
        }

        for (Employee target : allEmployees) {
            if (getLevelRank(target) < 4) continue;
            Long deptId = getDeptId(target);
            DepartmentFeedbackConfig config = (deptId != null && target.getLevel() != null) ? deptConfigs.get(deptId + ":" + target.getLevel().getLevelId()) : null;

            int reqPeers = (config != null && config.getMaxPeers() != null) ? config.getMaxPeers() : globalConfig.getDefaultMaxPeers();
            int reqSubs = (config != null && config.getMaxSubordinates() != null) ? config.getMaxSubordinates() : globalConfig.getDefaultMaxSubordinates();

            if (reqPeers > 0) {
                int availablePeers = findPeersByDepartment(target).size();
                if (availablePeers < reqPeers) {
                    String deptName = getDeptName(target);
                    warnings.add(String.format("%s (%s): Peers available (%d) < Limit (%d)", target.getStaffName(), deptName, availablePeers, reqPeers));
                }
            }
            if (reqSubs > 0) {
                int availableSubs = findSubordinatesByDepartment(target).size();
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
            generateRequestsForEmployee(cycle, target, cycleId, previousCycleId, globalMaxLimit, workloadMap, deptConfigs, persist, previewResults, excludedEvaluatorsMap, defaultForm);
        }
        return previewResults;
    }

    private void generateRequestsForEmployee(AppraisalCycle cycle, Employee target, Long cycleId, Long previousCycleId, int globalMaxLimit, Map<Long, Integer> workloadMap, Map<String, DepartmentFeedbackConfig> deptConfigs, boolean persist, List<FeedbackRequestResponse> previewResults, Map<Long, Set<Long>> excludedEvaluatorsMap, AppraisalForm form) {
        int rank = getLevelRank(target);
        if (rank < 4) return;

        Set<Long> excluded = excludedEvaluatorsMap.getOrDefault(target.getId(), Collections.emptySet());
        Long deptId = getDeptId(target);
        DepartmentFeedbackConfig config = (deptId != null && target.getLevel() != null) ? deptConfigs.get(deptId + ":" + target.getLevel().getLevelId()) : null;
        GlobalFeedbackConfig globalConfig = globalConfigRepository.findFirstByIsActiveTrue().orElse(new GlobalFeedbackConfig());

        int maxPeers = (config != null && config.getMaxPeers() != null) ? config.getMaxPeers() : globalConfig.getDefaultMaxPeers();
        int maxSubs = (config != null && config.getMaxSubordinates() != null) ? config.getMaxSubordinates() : globalConfig.getDefaultMaxSubordinates();

        handleRequest(cycle, target, target, FeedbackRelationship.SELF, false, workloadMap, 999, persist, previewResults, true, form, maxPeers, maxSubs);

        if (rank == 4) {
            Employee rotationEval = evaluatorRotationService.assignTopManagementEvaluator(target.getId(), cycleId, previousCycleId);
            if (rotationEval != null) handleRequest(cycle, target, rotationEval, FeedbackRelationship.SUPERIOR, false, workloadMap, globalMaxLimit, persist, previewResults, true, form, maxPeers, maxSubs);
            else assignManager(cycle, target, workloadMap, globalMaxLimit, persist, previewResults, true, form, maxPeers, maxSubs);
        } else {
            assignManager(cycle, target, workloadMap, globalMaxLimit, persist, previewResults, true, form, maxPeers, maxSubs);
        }

        List<Employee> peerPool = (rank == 4) ? findPeersGlobal(target) : (rank == 7) ? findPeersHybrid(target, maxPeers) : findPeersByDepartment(target);
        List<Employee> rotatedPeers = peerPool.stream().filter(p -> !excluded.contains(p.getId())).collect(Collectors.toList());
        if (rotatedPeers.size() < maxPeers) peerPool.forEach(p -> { if (!rotatedPeers.contains(p)) rotatedPeers.add(p); });

        Collections.shuffle(rotatedPeers);
        int pCount = 0;
        for (Employee p : rotatedPeers) {
            if (pCount >= maxPeers) break;
            if (handleRequest(cycle, target, p, FeedbackRelationship.PEER, true, workloadMap, globalMaxLimit, persist, previewResults, false, form, maxPeers, maxSubs)) pCount++;
        }
        if (pCount < maxPeers) {
            for (Employee p : rotatedPeers) {
                if (pCount >= maxPeers) break;
                if (handleRequest(cycle, target, p, FeedbackRelationship.PEER, true, workloadMap, globalMaxLimit, persist, previewResults, true, form, maxPeers, maxSubs)) pCount++;
            }
        }

        if (maxSubs > 0) {
            List<Employee> subPool = (rank == 6) ? findSubordinatesByTeam(target) : findSubordinatesByDepartment(target);
            List<Employee> rotatedSubs = subPool.stream().filter(s -> !excluded.contains(s.getId())).collect(Collectors.toList());
            if (rotatedSubs.size() < maxSubs) subPool.forEach(s -> { if (!rotatedSubs.contains(s)) rotatedSubs.add(s); });
            Collections.shuffle(rotatedSubs);
            int sCount = 0;
            for (Employee s : rotatedSubs) {
                if (sCount >= maxSubs) break;
                if (handleRequest(cycle, target, s, FeedbackRelationship.SUBORDINATE, true, workloadMap, globalMaxLimit, persist, previewResults, true, form, maxPeers, maxSubs)) sCount++;
            }
        }
    }

    private List<Employee> findPeersHybrid(Employee target, int maxPeers) {
        List<Employee> pool = findPeersByTeam(target);
        if (pool.size() < maxPeers) findPeersByDepartment(target).forEach(p -> { if (!pool.contains(p)) pool.add(p); });
        return pool;
    }

    private Long getDeptId(Employee e) {
        return departmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(e.getId()).map(ed -> ed.getCurrentDepartment() != null ? ed.getCurrentDepartment().getId() : null).orElse(null);
    }

    private String getDeptName(Employee e) {
        return departmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(e.getId())
                .map(ed -> ed.getCurrentDepartment() != null ? ed.getCurrentDepartment().getDepartmentName() : "N/A")
                .orElse("N/A");
    }

    private void assignManager(AppraisalCycle cycle, Employee target, Map<Long, Integer> workloadMap, int limit, boolean persist, List<FeedbackRequestResponse> previewResults, boolean strictDept, AppraisalForm form, Integer pLimit, Integer sLimit) {
        reportingLineRepository.findByEmployeeAndIsActiveTrue(target).ifPresent(line -> {
            Employee m = line.getManager();
            if (strictDept) {
                Long td = getDeptId(target); Long md = getDeptId(m);
                if (td == null || !td.equals(md)) return;
            }
            handleRequest(cycle, target, m, FeedbackRelationship.MANAGER, false, workloadMap, limit, persist, previewResults, true, form, pLimit, sLimit);
        });
    }

    private boolean handleRequest(AppraisalCycle cycle, Employee target, Employee evaluator, FeedbackRelationship rel, boolean anon, Map<Long, Integer> workloadMap, int limit, boolean persist, List<FeedbackRequestResponse> previewResults, boolean allowReciprocal, AppraisalForm form, Integer pLimit, Integer sLimit) {
        if (target == null || evaluator == null) return false;
        if (target.getId().equals(evaluator.getId()) && rel != FeedbackRelationship.SELF) return false;
        int currentWorkload = workloadMap.getOrDefault(evaluator.getId(), 0);
        if (currentWorkload >= limit) return false;

        boolean isReciprocal = persist ? requestRepository.existsByTargetUserIdAndEvaluatorIdAndCycleCycleId(evaluator.getId(), target.getId(), cycle.getCycleId())
                : previewResults.stream().anyMatch(r -> r.getTargetUserId().equals(evaluator.getId()) && r.getEvaluatorId().equals(target.getId()));
        if (isReciprocal && !allowReciprocal && rel == FeedbackRelationship.PEER) return false;

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
        return createRequest(cycle, target, evaluator, rel, anon, workloadMap, limit, isReciprocal, form, pLimit, sLimit);
    }

    private boolean createRequest(AppraisalCycle cycle, Employee target, Employee evaluator, FeedbackRelationship rel, boolean anon, Map<Long, Integer> workloadMap, int limit, boolean isFallback, AppraisalForm form, Integer pLimit, Integer sLimit) {
        if (target == null || evaluator == null || cycle == null) return false;
        int currentWorkload = workloadMap.getOrDefault(evaluator.getId(), 0);
        if (currentWorkload >= limit) return false;

        Optional<FeedbackRequest> existing = requestRepository.findByTargetUserIdAndEvaluatorIdAndCycleCycleId(target.getId(), evaluator.getId(), cycle.getCycleId());
        if (existing.isPresent()) {
            FeedbackRequest req = existing.get();
            if (req.getForm() == null && form != null) {
                req.setForm(form); req.setPeerLimitSnapshot(pLimit); req.setSubordinateLimitSnapshot(sLimit);
                requestRepository.save(req);
            }
            return false;
        }

        FeedbackRequest request = FeedbackRequest.builder().targetUser(target).evaluator(evaluator).cycle(cycle).relationship(rel).form(form).isAnonymous(anon).status(FeedbackStatus.PENDING).peerLimitSnapshot(pLimit).subordinateLimitSnapshot(sLimit).build();
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

    private List<Employee> findPeersByDepartment(Employee employee) {
        return departmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(employee.getId()).map(ed -> {
            if (ed.getCurrentDepartment() == null) return new ArrayList<Employee>();
            int rank = getLevelRank(employee);
            return departmentRepository.findByCurrentDepartmentIdAndIsCurrentTrue(ed.getCurrentDepartment().getId()).stream().map(ace.org.epms_backend.model.employee.EmployeeDepartment::getEmployee).filter(e -> e != null && !e.getId().equals(employee.getId()) && getLevelRank(e) == rank && e.getStatus() == ace.org.epms_backend.enums.EmployeeStatus.ACTIVE).collect(Collectors.toList());
        }).orElse(Collections.emptyList());
    }

    private List<Employee> findSubordinatesByDepartment(Employee target) {
        int rank = getLevelRank(target);
        return departmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(target.getId()).map(ed -> {
            if (ed.getCurrentDepartment() == null) return new ArrayList<Employee>();
            return departmentRepository.findByCurrentDepartmentIdAndIsCurrentTrue(ed.getCurrentDepartment().getId()).stream().map(ace.org.epms_backend.model.employee.EmployeeDepartment::getEmployee).filter(e -> e != null && getLevelRank(e) == (rank + 1) && e.getStatus() == ace.org.epms_backend.enums.EmployeeStatus.ACTIVE).collect(Collectors.toList());
        }).orElse(Collections.emptyList());
    }

    private List<Employee> findPeersGlobal(Employee target) {
        int rank = getLevelRank(target);
        return employeeRepository.findAll().stream().filter(e -> !e.getId().equals(target.getId()) && getLevelRank(e) == rank && e.getStatus() == ace.org.epms_backend.enums.EmployeeStatus.ACTIVE).collect(Collectors.toList());
    }

    private List<Employee> findPeersByTeam(Employee target) {
        List<Employee> peers = new ArrayList<>();
        int rank = getLevelRank(target);
        teamRepository.findByEmployeeIdAndIsPrimaryTrue(target.getId()).ifPresent(et -> {
            peers.addAll(teamRepository.findByTeamTeamId(et.getTeam().getTeamId()).stream().map(ace.org.epms_backend.model.employee.EmployeeTeam::getEmployee).filter(e -> e != null && !e.getId().equals(target.getId()) && getLevelRank(e) == rank && e.getStatus() == ace.org.epms_backend.enums.EmployeeStatus.ACTIVE).collect(Collectors.toList()));
        });
        return peers;
    }

    private List<Employee> findSubordinatesByTeam(Employee target) {
        List<Employee> subs = new ArrayList<>();
        int rank = getLevelRank(target);
        teamRepository.findFirstByEmployeeIdAndIsPrimaryTrue(target.getId()).ifPresent(et -> {
            subs.addAll(teamRepository.findByTeamTeamId(et.getTeam().getTeamId()).stream().map(ace.org.epms_backend.model.employee.EmployeeTeam::getEmployee).filter(e -> e != null && getLevelRank(e) == (rank + 1) && e.getStatus() == ace.org.epms_backend.enums.EmployeeStatus.ACTIVE).collect(Collectors.toList()));
        });
        return subs;
    }

    @Override
    @Transactional
    public void generateRequests(FeedbackRequestGenerateDTO dto) {
        AppraisalCycle cycle = cycleRepository.findById(dto.getCycleId()).orElseThrow(() -> new NotFoundException("Cycle not found"));
        AppraisalForm manualForm = dto.getFormId() != null ? formRepository.findById(dto.getFormId()).orElseThrow(() -> new NotFoundException("Form not found")) : null;
        Map<Long, Integer> workloadMap = new HashMap<>();
        for (Long eid : dto.getEmployeeIds()) {
            Employee target = employeeRepository.findById(eid).orElseThrow(() -> new NotFoundException("Employee not found"));
            createRequest(cycle, target, target, FeedbackRelationship.SELF, false, workloadMap, 999, false, manualForm, null, null);
            reportingLineRepository.findByEmployeeAndIsActiveTrue(target).ifPresent(rl -> createRequest(cycle, target, rl.getManager(), FeedbackRelationship.MANAGER, false, workloadMap, 99, false, manualForm, null, null));
            List<Employee> peers = findPeersByDepartment(target); Collections.shuffle(peers);
            int pCount = 0; for (Employee p : peers) { if (pCount >= dto.getPeerLimit()) break; if (createRequest(cycle, target, p, FeedbackRelationship.PEER, true, workloadMap, 99, false, manualForm, dto.getPeerLimit(), 0)) pCount++; }
            if (Boolean.TRUE.equals(dto.getIncludeSubordinates())) {
                reportingLineRepository.findAllByManagerAndIsActiveTrue(target).forEach(rl -> createRequest(cycle, target, rl.getEmployee(), FeedbackRelationship.SUBORDINATE, true, workloadMap, 99, false, manualForm, 0, 0));
            }
        }
    }

    private int getLevelRank(Employee employee) {
        return (employee.getLevel() != null && employee.getLevel().getLevelRank() != null) ? employee.getLevel().getLevelRank() : 99;
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
        AppraisalForm defaultForm = cycle.getForms().stream().filter(f -> f.getFormType() == FormType.FEEDBACK).findFirst().orElse(null);
        generateRequestsForEmployee(cycle, target, cycleId, previousCycleId, globalMaxLimit, workloadMap, deptConfigs, true, new ArrayList<>(), excluded, defaultForm);
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
}
