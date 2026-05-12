package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.feedback360.FeedbackRequestResponse;
import ace.org.epms_backend.enums.FeedbackRelationship;
import ace.org.epms_backend.enums.FeedbackStatus;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.FeedbackMapper;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.feedback360.FeedbackRequest;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.AppraisalCycleRepository;
import ace.org.epms_backend.repository.EmployeeDepartmentRepository;
import ace.org.epms_backend.repository.employee.EmployeeTeamRepository;
import ace.org.epms_backend.repository.employee.ReportingLineRepository;
import ace.org.epms_backend.model.employee.ReportingLine;
import ace.org.epms_backend.dto.feedback360.FeedbackRequestGenerateDTO;
import ace.org.epms_backend.repository.feedback360.FeedbackRequestRepository;
import ace.org.epms_backend.service.feedback360.FeedbackRequestService;
import ace.org.epms_backend.service.feedback360.EvaluatorRotationService;
import ace.org.epms_backend.model.feedback360.DepartmentFeedbackConfig;
import ace.org.epms_backend.repository.feedback360.DepartmentFeedbackConfigRepository;
import ace.org.epms_backend.model.appraisal.AppraisalForm;
import ace.org.epms_backend.repository.AppraisalFormRepository;
import ace.org.epms_backend.enums.FormType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;
import ace.org.epms_backend.dto.notification.NotificationEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
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
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public void generate360FeedbackRequests(Long cycleId, Long previousCycleId, int globalMaxLimit, boolean excludeLongTermLeave) {
        process360Generation(cycleId, previousCycleId, globalMaxLimit, true, excludeLongTermLeave);
    }

    @Override
    public List<FeedbackRequestResponse> preview360FeedbackRequests(Long cycleId, Long previousCycleId, int globalMaxLimit, boolean excludeLongTermLeave) {
        List<FeedbackRequestResponse> preview = process360Generation(cycleId, previousCycleId, globalMaxLimit, false, excludeLongTermLeave);
        // Sort by Target Department Name
        preview.sort(java.util.Comparator.comparing(r -> r.getTargetDepartmentName() != null ? r.getTargetDepartmentName() : ""));
        return preview;
    }

    @Override
    @Transactional
    public void regenerateUserFeedbackRequests(Long targetEmployeeId, Long cycleId, Long previousCycleId, int globalMaxLimit) {
        AppraisalCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new NotFoundException("Cycle not found"));
        Employee target = employeeRepository.findById(targetEmployeeId)
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        // 1. Delete existing PENDING requests for this target in this cycle
        requestRepository.deleteByTargetUserIdAndCycleCycleIdAndStatus(targetEmployeeId, cycleId, FeedbackStatus.PENDING);
        log.info("Deleted pending requests for employee {} to prepare for regeneration", targetEmployeeId);

        // 2. Initialize workload map from existing records
        java.util.Map<Long, Integer> workloadMap = new java.util.HashMap<>();
        requestRepository.findByCycleCycleId(cycleId).forEach(req -> {
            Long evalId = req.getEvaluator().getId();
            workloadMap.put(evalId, workloadMap.getOrDefault(evalId, 0) + 1);
        });

        // 3. Fetch configs
        java.util.Map<String, DepartmentFeedbackConfig> deptConfigs = deptConfigRepository.findAll().stream()
                .filter(c -> c.getDepartment() != null && c.getJobLevel() != null)
                .collect(Collectors.toMap(
                    c -> c.getDepartment().getId() + ":" + c.getJobLevel().getLevelId(), 
                    c -> c, 
                    (a, b) -> a));

        // 4. Fetch previous cycle assignments for rotation
        java.util.Map<Long, java.util.Set<Long>> excludedEvaluatorsMap = new java.util.HashMap<>();
        if (previousCycleId != null) {
            requestRepository.findByCycleCycleId(previousCycleId).forEach(req -> {
                Long tid = req.getTargetUser().getId();
                Long eid = req.getEvaluator().getId();
                excludedEvaluatorsMap.computeIfAbsent(tid, k -> new java.util.HashSet<>()).add(eid);
            });
        }

        // 5. Resolve default form for the cycle
        AppraisalForm defaultForm = cycle.getForms().stream()
                .filter(f -> f.getFormType() == FormType.FEEDBACK)
                .findFirst()
                .orElse(null);

        // 6. Regenerate for this one employee
        generateRequestsForEmployee(cycle, target, cycleId, previousCycleId, globalMaxLimit, workloadMap, deptConfigs, true, new ArrayList<>(), excludedEvaluatorsMap, defaultForm);
        log.info("Successfully regenerated 360 feedback requests for employee: {}", targetEmployeeId);
    }

    private List<FeedbackRequestResponse> process360Generation(Long cycleId, Long previousCycleId, int globalMaxLimit, boolean persist, boolean excludeLongTermLeave) {
        AppraisalCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new NotFoundException("Cycle not found"));

        log.info("{} 360 feedback generation for cycle: {}. Global Max Limit: {}. Exclude Long Term Leave: {}", 
                persist ? "Starting" : "Previewing", cycleId, globalMaxLimit, excludeLongTermLeave);

        List<FeedbackRequestResponse> previewResults = new ArrayList<>();
        java.util.Map<Long, Integer> workloadMap = new java.util.HashMap<>();

        if (persist) {
            requestRepository.findByCycleCycleId(cycleId).forEach(req -> {
                Long evalId = req.getEvaluator().getId();
                workloadMap.put(evalId, workloadMap.getOrDefault(evalId, 0) + 1);
            });
        }

        java.util.Map<String, DepartmentFeedbackConfig> deptConfigs = deptConfigRepository.findAll().stream()
                .filter(c -> c.getDepartment() != null && c.getJobLevel() != null)
                .collect(Collectors.toMap(
                    c -> c.getDepartment().getId() + ":" + c.getJobLevel().getLevelId(), 
                    c -> c, 
                    (a, b) -> a));

        List<Employee> allEmployees = employeeRepository.findAll().stream()
                .filter(e -> getLevelRank(e) < 8)
                .filter(e -> !excludeLongTermLeave || e.getStatus() != ace.org.epms_backend.enums.EmployeeStatus.LONG_TERM_LEAVE)
                .filter(e -> e.getStatus() != ace.org.epms_backend.enums.EmployeeStatus.RESIGNED)
                .collect(Collectors.toList());

        java.util.Map<Long, java.util.Set<Long>> excludedEvaluatorsMap = new java.util.HashMap<>();
        if (previousCycleId != null) {
            requestRepository.findByCycleCycleId(previousCycleId).forEach(req -> {
                Long targetId = req.getTargetUser().getId();
                Long evalId = req.getEvaluator().getId();
                excludedEvaluatorsMap.computeIfAbsent(targetId, k -> new java.util.HashSet<>()).add(evalId);
            });
            log.info("Loaded {} previous assignments to enforce rotation rules.", excludedEvaluatorsMap.size());
        }

        // Resolve default form for the cycle (type = FEEDBACK)
        AppraisalForm defaultForm = cycle.getForms().stream()
                .filter(f -> f.getFormType() == FormType.FEEDBACK)
                .findFirst()
                .orElse(null);

        for (Employee target : allEmployees) {
            generateRequestsForEmployee(cycle, target, cycleId, previousCycleId, globalMaxLimit, workloadMap, deptConfigs, persist, previewResults, excludedEvaluatorsMap, defaultForm);
        }
        return previewResults;
    }

    private void generateRequestsForEmployee(AppraisalCycle cycle, Employee target, Long cycleId, Long previousCycleId, 
                                            int globalMaxLimit, java.util.Map<Long, Integer> workloadMap, 
                                            java.util.Map<String, DepartmentFeedbackConfig> deptConfigs, 
                                            boolean persist, List<FeedbackRequestResponse> previewResults,
                                            java.util.Map<Long, java.util.Set<Long>> excludedEvaluatorsMap,
                                            AppraisalForm form) {
        int rank = getLevelRank(target);
        if (rank < 4) return;

        java.util.Set<Long> excludedForThisTarget = excludedEvaluatorsMap.getOrDefault(target.getId(), java.util.Collections.emptySet());

        Long deptId = departmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(target.getId())
                .map(ed -> ed.getCurrentDepartment() != null ? ed.getCurrentDepartment().getId() : null)
                .orElse(null);
        
        DepartmentFeedbackConfig config = null;
        if (deptId != null && target.getLevel() != null) {
            config = deptConfigs.get(deptId + ":" + target.getLevel().getLevelId());
        }
        
        int maxPeers;
        int maxSubs;

        if (config != null) {
            maxPeers = config.getMaxPeers() != null ? config.getMaxPeers() : 3;
            maxSubs = config.getMaxSubordinates() != null ? config.getMaxSubordinates() : 3;
        } else {
            // Default ranges based on the level-based target assignment table
            switch (rank) {
                case 4: maxPeers = 2; maxSubs = 3; break;
                case 5: maxPeers = 3; maxSubs = 3; break;
                case 6: maxPeers = 3; maxSubs = 4; break;
                case 7: maxPeers = 5; maxSubs = 0; break;
                default: maxPeers = 3; maxSubs = 3; break;
            }
        }

        // 1. SELF
        handleRequest(cycle, target, target, FeedbackRelationship.SELF, false, workloadMap, 999, persist, previewResults, true, form);

        // 2. MANAGER / SUPERIOR
        if (rank == 4) {
            // L01-L03 evaluates L04 Head (Global Shuffle/Rotation)
            Employee rotationEval = evaluatorRotationService.assignTopManagementEvaluator(target.getId(), cycleId, previousCycleId);
            if (rotationEval != null) {
                handleRequest(cycle, target, rotationEval, FeedbackRelationship.SUPERIOR, false, workloadMap, globalMaxLimit, persist, previewResults, true, form);
            } else {
                assignManager(cycle, target, workloadMap, globalMaxLimit, persist, previewResults, true, form); // Strict Dept
            }
        } else {
            // L05, L06, L07 Superiors must be in SAME DEPARTMENT
            assignManager(cycle, target, workloadMap, globalMaxLimit, persist, previewResults, true, form); // Strict Dept
        }

        // 3. PEERS
        List<Employee> peerPool = new java.util.ArrayList<>();
        if (rank == 4) {
            // L04 Heads can have Global Shuffle for peers
            peerPool.addAll(findPeersGlobal(target)); 
        } else if (rank == 7) {
            // L07 Peers: Team first, then Department
            List<Employee> teamPeers = findPeersByTeam(target);
            peerPool.addAll(teamPeers);
            
            if (peerPool.size() < maxPeers) {
                List<Employee> deptPeers = findPeersByDepartment(target);
                for (Employee dp : deptPeers) {
                    if (!peerPool.contains(dp)) {
                        peerPool.add(dp);
                    }
                }
            }
        } else {
            // L05 and L06 must be SAME DEPARTMENT for peers
            peerPool.addAll(findPeersByDepartment(target));
        }
        
        // ROTATION: Filter out peers who evaluated this target in previous cycle
        List<Employee> rotatedPeerPool = peerPool.stream()
                .filter(p -> !excludedForThisTarget.contains(p.getId()))
                .collect(Collectors.toList());
        
        // Fallback: If not enough new peers, use some from the previous cycle but keep them at the end of shuffle
        if (rotatedPeerPool.size() < maxPeers) {
            for (Employee p : peerPool) {
                if (!rotatedPeerPool.contains(p)) rotatedPeerPool.add(p);
            }
        }

        Collections.shuffle(rotatedPeerPool);
        int pCount = 0;
        
        // PASS 1: Rotated & Non-Reciprocal (List A)
        for (Employee peer : rotatedPeerPool) {
            if (pCount >= maxPeers) break;
            if (handleRequest(cycle, target, peer, FeedbackRelationship.PEER, true, workloadMap, globalMaxLimit, persist, previewResults, false, form)) {
                pCount++;
            }
        }

        // PASS 2: Rotated & Reciprocal (List B - Fallback)
        if (pCount < maxPeers) {
            for (Employee peer : rotatedPeerPool) {
                if (pCount >= maxPeers) break;
                if (handleRequest(cycle, target, peer, FeedbackRelationship.PEER, true, workloadMap, globalMaxLimit, persist, previewResults, true, form)) {
                    pCount++;
                }
            }
        }

        // PASS 3: Non-Rotated (Last Resort)
        if (pCount < maxPeers) {
            for (Employee p : peerPool) {
                if (pCount >= maxPeers) break;
                if (handleRequest(cycle, target, p, FeedbackRelationship.PEER, true, workloadMap, globalMaxLimit, persist, previewResults, true, form)) {
                    pCount++;
                }
            }
        }

        // 4. SUBORDINATES
        if (maxSubs > 0) {
            // Subordinates (L04, L05, L06 must be SAME DEPARTMENT)
            List<Employee> subPool = (rank == 6) ? findSubordinatesByTeam(target) : findSubordinatesByDepartment(target);
            
            // ROTATION: Filter out subordinates who evaluated this target in previous cycle
            List<Employee> rotatedSubPool = subPool.stream()
                    .filter(s -> !excludedForThisTarget.contains(s.getId()))
                    .collect(Collectors.toList());

            if (rotatedSubPool.size() < maxSubs) {
                for (Employee s : subPool) {
                    if (!rotatedSubPool.contains(s)) rotatedSubPool.add(s);
                }
            }

            Collections.shuffle(rotatedSubPool);
            int sCount = 0;
            
            // PASS 1: Non-Reciprocal
            for (Employee sub : rotatedSubPool) {
                if (sCount >= maxSubs) break;
                if (handleRequest(cycle, target, sub, FeedbackRelationship.SUBORDINATE, true, workloadMap, globalMaxLimit, persist, previewResults, false, form)) {
                    sCount++;
                }
            }
            
            // PASS 2: Reciprocal Fallback
            if (sCount < maxSubs) {
                for (Employee sub : rotatedSubPool) {
                    if (sCount >= maxSubs) break;
                    if (handleRequest(cycle, target, sub, FeedbackRelationship.SUBORDINATE, true, workloadMap, globalMaxLimit, persist, previewResults, true, form)) {
                        sCount++;
                    }
                }
            }
        }
    }


    private List<Employee> findPeersGlobal(Employee target) {
        int targetRank = getLevelRank(target);
        return employeeRepository.findAll().stream()
                .filter(e -> !e.getId().equals(target.getId()) && getLevelRank(e) == targetRank)
                .collect(Collectors.toList());
    }

    private List<Employee> findSubordinatesGlobal(Employee target) {
        int targetRank = getLevelRank(target);
        return employeeRepository.findAll().stream()
                .filter(e -> getLevelRank(e) > targetRank)
                .collect(Collectors.toList());
    }

    private void assignManager(AppraisalCycle cycle, Employee target, java.util.Map<Long, Integer> workloadMap, int limit, boolean persist, List<FeedbackRequestResponse> previewResults, boolean strictDept, AppraisalForm form) {
        reportingLineRepository.findByEmployeeAndIsActiveTrue(target)
                .ifPresent(line -> {
                    Employee manager = line.getManager();
                    if (strictDept) {
                        // Check if manager is in the same department
                        Long targetDeptId = departmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(target.getId())
                                .map(ed -> ed.getCurrentDepartment() != null ? ed.getCurrentDepartment().getId() : null)
                                .orElse(-1L);
                        Long managerDeptId = departmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(manager.getId())
                                .map(ed -> ed.getCurrentDepartment() != null ? ed.getCurrentDepartment().getId() : null)
                                .orElse(-2L);
                        
                        if (!targetDeptId.equals(managerDeptId)) {
                            log.info("Skipping manager {} for target {} - Different department", manager.getId(), target.getId());
                            return;
                        }
                    }
                    handleRequest(cycle, target, manager, FeedbackRelationship.MANAGER, false, workloadMap, limit, persist, previewResults, true, form);
                });
    }

    private boolean handleRequest(AppraisalCycle cycle, Employee target, Employee evaluator, FeedbackRelationship rel,
                                  boolean anon, java.util.Map<Long, Integer> workloadMap, int limit, boolean persist, 
                                  List<FeedbackRequestResponse> previewResults, boolean allowReciprocal,
                                  AppraisalForm form) {
        if (target == null || evaluator == null) return false;

        // Skip if same person
        if (target.getId().equals(evaluator.getId()) && rel != FeedbackRelationship.SELF) return false;

        int currentWorkload = workloadMap.getOrDefault(evaluator.getId(), 0);
        if (currentWorkload >= limit) return false;

        // Anti-Reciprocal (Anti-Quid-Pro-Quo) Logic
        boolean isReciprocal = false;
        if (persist) {
            isReciprocal = requestRepository.existsByTargetUserIdAndEvaluatorIdAndCycleCycleId(evaluator.getId(), target.getId(), cycle.getCycleId());
        } else {
            isReciprocal = previewResults.stream()
                    .anyMatch(r -> r.getTargetUserId().equals(evaluator.getId()) && r.getEvaluatorId().equals(target.getId()));
        }

        // List B logic: If it's reciprocal but we don't allow it in this pass, skip it
        if (isReciprocal && !allowReciprocal && rel == FeedbackRelationship.PEER) {
            return false;
        }

        if (!persist) {
            // Check if already in preview to avoid duplicates
            boolean existsInPreview = previewResults.stream()
                    .anyMatch(r -> r.getTargetUserId().equals(target.getId()) && r.getEvaluatorId().equals(evaluator.getId()));
            if (existsInPreview) return false;

            String targetDept = departmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(target.getId())
                    .map(ed -> ed.getCurrentDepartment() != null ? ed.getCurrentDepartment().getDepartmentName() : "N/A")
                    .orElse("N/A");
            String evalDept = departmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(evaluator.getId())
                    .map(ed -> ed.getCurrentDepartment() != null ? ed.getCurrentDepartment().getDepartmentName() : "N/A")
                    .orElse("N/A");

            previewResults.add(FeedbackRequestResponse.builder()
                    .targetUserId(target.getId())
                    .targetUserName(target.getStaffName())
                    .targetDepartmentName(targetDept)
                    .evaluatorId(evaluator.getId())
                    .evaluatorName(evaluator.getStaffName())
                    .evaluatorDepartmentName(evalDept)
                    .relationship(rel)
                    .status(FeedbackStatus.PENDING)
                    .isAnonymous(anon)
                    .isReciprocalFallback(isReciprocal)
                    .build());
            workloadMap.put(evaluator.getId(), currentWorkload + 1);
            return true;
        }

        return createRequest(cycle, target, evaluator, rel, anon, workloadMap, limit, isReciprocal, form);
    }

    private List<Employee> findPeersByDepartment(Employee employee) {
        return departmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(employee.getId())
                .map(ed -> {
                    if (ed.getCurrentDepartment() == null) return new java.util.ArrayList<Employee>();
                    int targetRank = getLevelRank(employee);
                    return departmentRepository.findByCurrentDepartmentIdAndIsCurrentTrue(ed.getCurrentDepartment().getId())
                            .stream()
                            .map(ace.org.epms_backend.model.employee.EmployeeDepartment::getEmployee)
                            .filter(e -> e != null && !e.getId().equals(employee.getId()) && getLevelRank(e) == targetRank)
                            .collect(Collectors.toList());
                }).orElse(Collections.emptyList());
    }

    private List<Employee> findSubordinatesByDepartment(Employee target) {
        // For L04-L05, subordinates can be anyone in their department who is at a lower level
        int targetRank = getLevelRank(target);
        return departmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(target.getId())
                .map(ed -> {
                    if (ed.getCurrentDepartment() == null) return new java.util.ArrayList<Employee>();
                    return departmentRepository.findByCurrentDepartmentIdAndIsCurrentTrue(ed.getCurrentDepartment().getId())
                            .stream()
                            .map(ace.org.epms_backend.model.employee.EmployeeDepartment::getEmployee)
                            .filter(e -> e != null && getLevelRank(e) == (targetRank + 1))
                            .collect(Collectors.toList());
                }).orElse(Collections.emptyList());
    }

    private List<Employee> findPeersByTeam(Employee target) {
        List<Employee> teamPeers = new ArrayList<>();
        int targetRank = getLevelRank(target);
        teamRepository.findByEmployeeIdAndIsPrimaryTrue(target.getId())
                .ifPresent(et -> {
                    teamPeers.addAll(teamRepository.findByTeamTeamId(et.getTeam().getTeamId()).stream()
                            .map(ace.org.epms_backend.model.employee.EmployeeTeam::getEmployee)
                            .filter(e -> e != null && !e.getId().equals(target.getId()) && getLevelRank(e) == targetRank)
                            .collect(Collectors.toList()));
                });
        return teamPeers;
    }

    private List<Employee> findSubordinatesByTeam(Employee target) {
        List<Employee> teamMembers = new ArrayList<>();
        teamRepository.findFirstByEmployeeIdAndIsPrimaryTrue(target.getId())
                .ifPresent(et -> {
                    teamMembers.addAll(teamRepository.findByTeamTeamId(et.getTeam().getTeamId()).stream()
                            .map(ace.org.epms_backend.model.employee.EmployeeTeam::getEmployee)
                            .filter(e -> e != null && getLevelRank(e) == (getLevelRank(target) + 1))
                            .collect(Collectors.toList()));
                });
        return teamMembers;
    }

    @Override
    @Transactional
    public void generateRequests(FeedbackRequestGenerateDTO dto) {
        AppraisalCycle cycle = cycleRepository.findById(dto.getCycleId())
                .orElseThrow(() -> new NotFoundException("Cycle not found"));

        AppraisalForm manualForm = null;
        if (dto.getFormId() != null) {
            manualForm = formRepository.findById(dto.getFormId())
                    .orElseThrow(() -> new NotFoundException("Form not found: " + dto.getFormId()));
        }

        java.util.Map<Long, Integer> workloadMap = new java.util.HashMap<>();
        int limit = 99; // Default high limit for manual generation

        for (Long employeeId : dto.getEmployeeIds()) {
            Employee target = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new NotFoundException("Employee not found: " + employeeId));

            // 1. SELF
            createRequest(cycle, target, target, FeedbackRelationship.SELF, false, workloadMap, 999, false, manualForm);

            // 2. MANAGER
            final AppraisalForm finalForm = manualForm;
            reportingLineRepository.findByEmployeeAndIsActiveTrue(target)
                    .ifPresent(reportingLine -> {
                        createRequest(cycle, target, reportingLine.getManager(), FeedbackRelationship.MANAGER, false, workloadMap, limit, false, finalForm);
                    });

            // 3. PEERS (DEPARTMENT BASED)
            List<Employee> peers = findPeersByDepartment(target);
            Collections.shuffle(peers);
            int peerCount = 0;
            for (Employee peer : peers) {
                if (peerCount >= dto.getPeerLimit()) break;
                if (createRequest(cycle, target, peer, FeedbackRelationship.PEER, true, workloadMap, limit, false, finalForm)) {
                    peerCount++;
                }
            }

            // 4. SUBORDINATES
            if (Boolean.TRUE.equals(dto.getIncludeSubordinates())) {
                List<ReportingLine> subLines = reportingLineRepository.findAllByManagerAndIsActiveTrue(target);
                for (ReportingLine line : subLines) {
                    createRequest(cycle, target, line.getEmployee(), FeedbackRelationship.SUBORDINATE, true, workloadMap, limit, false, finalForm);
                }
            }
        }
    }

    private int getLevelRank(Employee employee) {
        if (employee.getLevel() != null && employee.getLevel().getLevelRank() != null) {
            return employee.getLevel().getLevelRank();
        }
        return 99; // Default for unknown level
    }

    private boolean createRequest(AppraisalCycle cycle, Employee target, Employee evaluator, FeedbackRelationship rel, 
                                 boolean anon, java.util.Map<Long, Integer> workloadMap, int limit, boolean isFallback,
                                 AppraisalForm form) {
        if (target == null || evaluator == null || cycle == null) {
            log.warn("Skipping request creation due to null values: target={}, evaluator={}, cycle={}", 
                    target != null ? target.getId() : "null", 
                    evaluator != null ? evaluator.getId() : "null", 
                    cycle != null ? cycle.getCycleId() : "null");
            return false;
        }

        // Check workload limit
        int currentWorkload = workloadMap.getOrDefault(evaluator.getId(), 0);
        if (currentWorkload >= limit) {
            log.info("Skipping evaluator {} - Workload limit reached ({}/{})", evaluator.getId(), currentWorkload, limit);
            return false;
        }

        if (!requestRepository.existsByTargetUserIdAndEvaluatorIdAndCycleCycleId(target.getId(), evaluator.getId(),
                cycle.getCycleId())) {
            FeedbackRequest request = FeedbackRequest.builder()
                    .targetUser(target)
                    .evaluator(evaluator)
                    .cycle(cycle)
                    .relationship(rel)
                    .form(form)
                    .isAnonymous(anon)
                    .status(FeedbackStatus.PENDING)
                    .build();
//            requestRepository.save(request);
            requestRepository.save(request);
            // Update workload map
            workloadMap.put(evaluator.getId(), currentWorkload + 1);

            log.info("Created {} request: Target {} <- Evaluator {} (Workload: {})", 
                rel, target.getId(), evaluator.getId(), currentWorkload + 1);
            // Notify Evaluator
            eventPublisher.publishEvent(NotificationEvent.builder()
                    .recipientId(evaluator.getId())
                    .type(NotificationType.FEEDBACK_REQUESTED)
                    .title("Feedback Requested")
                    .message("You have been requested to provide 360 feedback for "
                            + (anon ? "a colleague" : target.getStaffName()) + ".")
                    .referenceType(ReferenceType.FEEDBACK)
                    .referenceId(request.getId())
                    .actionUrl("/feedback/my-pending")
                    .build());
            return true;
        }
        return false;
    }

    @Override
    public List<FeedbackRequestResponse> getMyPendingRequests(Long evaluatorId) {
        return requestRepository.findByEvaluatorIdAndStatus(evaluatorId, FeedbackStatus.PENDING).stream()
                .map(feedbackMapper::toRequestResponse)
                .collect(Collectors.toList());
    }

    /*
    @Override
    public List<FeedbackRequestResponse> getRequestsByEmployee(Long targetEmployeeId, Long cycleId) {
        return requestRepository.findByTargetUserIdAndCycleCycleId(targetEmployeeId, cycleId).stream()
                .map(feedbackMapper::toRequestResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<FeedbackRequestResponse> getRequestsByCycle(Long cycleId) {
        return requestRepository.findByCycleCycleId(cycleId).stream()
                .map(feedbackMapper::toRequestResponse)
                .collect(Collectors.toList());
    }

    @Override
    public FeedbackRequestResponse getRequest(Long requestId) {
        return requestRepository.findById(requestId)
                .map(feedbackMapper::toRequestResponse)
                .orElseThrow(() -> new NotFoundException("Request not found"));
    }

    @Override
    @Transactional
    public void updateRequestStatus(Long requestId, FeedbackStatus status) {
        FeedbackRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Request not found"));
        request.setStatus(status);
        requestRepository.save(request);
    }

    @Override
    @Transactional
    public void deleteRequest(Long requestId) {
        requestRepository.deleteById(requestId);
    }
    */
}
