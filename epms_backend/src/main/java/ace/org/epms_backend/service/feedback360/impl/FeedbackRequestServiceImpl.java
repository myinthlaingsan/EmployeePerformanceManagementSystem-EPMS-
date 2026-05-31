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
import ace.org.epms_backend.service.feedback360.SecurityHelper;
import ace.org.epms_backend.model.feedback360.DepartmentFeedbackConfig;
import ace.org.epms_backend.repository.feedback360.DepartmentFeedbackConfigRepository;
import ace.org.epms_backend.enums.FormType;
import ace.org.epms_backend.model.appraisal.AppraisalForm;
import ace.org.epms_backend.repository.AppraisalFormRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;
import ace.org.epms_backend.dto.notification.NotificationEvent;
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
    private final ApplicationEventPublisher eventPublisher;
    private final SecurityHelper securityHelper;

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
        Long viewerId = securityHelper.currentUserId();
        return preview.stream()
                .map(r -> maskIfNeeded(r, viewerId))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void regenerateUserFeedbackRequests(Long targetEmployeeId, Long cycleId, Long previousCycleId, int globalMaxLimit) {
        AppraisalCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new NotFoundException("Cycle not found"));

        if (!requestRepository.existsByCycleCycleId(cycleId)) {
            throw new IllegalArgumentException(
                    "Cycle " + cycleId + " has no generated requests yet. " +
                    "Click 'Generate' first before using per-employee Regen.");
        }

        Employee target = employeeRepository.findById(targetEmployeeId)
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        // 1. Delete existing PENDING requests for this target in this cycle
        requestRepository.deleteByTargetUserIdAndCycleCycleIdAndStatus(targetEmployeeId, cycleId, FeedbackStatus.PENDING);
        log.info("Deleted pending requests for employee {} to prepare for regeneration", targetEmployeeId);

        // 2. Initialize workload map from existing records
        Map<Long, Integer> workloadMap = new HashMap<>();
        requestRepository.findByCycleCycleId(cycleId).forEach(req -> {
            Long evalId = req.getEvaluator().getId();
            workloadMap.put(evalId, workloadMap.getOrDefault(evalId, 0) + 1);
        });

        // 3. Fetch configs
        Map<String, DepartmentFeedbackConfig> deptConfigs = deptConfigRepository.findAll().stream()
                .filter(c -> c.getDepartment() != null && c.getJobLevel() != null)
                .collect(Collectors.toMap(
                        c -> c.getDepartment().getId() + ":" + c.getJobLevel().getLevelId(),
                        c -> c,
                        (a, b) -> a));

        // 4. Fetch previous cycle assignments for rotation
        Map<Long, Set<Long>> excludedEvaluatorsMap = new HashMap<>();
        if (previousCycleId != null) {
            requestRepository.findByCycleCycleId(previousCycleId).forEach(req -> {
                Long tid = req.getTargetUser().getId();
                Long eid = req.getEvaluator().getId();
                excludedEvaluatorsMap.computeIfAbsent(tid, k -> new HashSet<>()).add(eid);
            });
        }

        // 5. Resolve forms per relationship
        Map<FeedbackRelationship, AppraisalForm> formByRel = resolveFeedbackForms(cycle);

        // 6. Regenerate for this one employee
        generateRequestsForEmployee(cycle, target, cycleId, previousCycleId, globalMaxLimit, workloadMap, deptConfigs, true, new ArrayList<>(), excludedEvaluatorsMap, formByRel);
        log.info("Successfully regenerated 360 feedback requests for employee: {}", targetEmployeeId);
    }

    private List<FeedbackRequestResponse> process360Generation(Long cycleId, Long previousCycleId, int globalMaxLimit, boolean persist, boolean excludeLongTermLeave) {
        AppraisalCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new NotFoundException("Cycle not found"));

        if (!Boolean.TRUE.equals(cycle.getIsActive())) {
            throw new IllegalArgumentException("Cycle " + cycleId + " is not active (status: " + cycle.getStatus()
                    + "). Only active cycles can have feedback generated or previewed.");
        }

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

        Map<String, DepartmentFeedbackConfig> deptConfigs = deptConfigRepository.findAll().stream()
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

        Map<Long, Set<Long>> excludedEvaluatorsMap = new HashMap<>();
        if (previousCycleId != null) {
            requestRepository.findByCycleCycleId(previousCycleId).forEach(req -> {
                Long targetId = req.getTargetUser().getId();
                Long evalId = req.getEvaluator().getId();
                excludedEvaluatorsMap.computeIfAbsent(targetId, k -> new HashSet<>()).add(evalId);
            });
            log.info("Loaded {} previous assignments to enforce rotation rules.", excludedEvaluatorsMap.size());
        }

        // Resolve forms per relationship
        Map<FeedbackRelationship, AppraisalForm> formByRel = resolveFeedbackForms(cycle);

        for (Employee target : allEmployees) {
            generateRequestsForEmployee(cycle, target, cycleId, previousCycleId, globalMaxLimit, workloadMap, deptConfigs, persist, previewResults, excludedEvaluatorsMap, formByRel);
        }
        return previewResults;
    }

    private Map<FeedbackRelationship, AppraisalForm> resolveFeedbackForms(AppraisalCycle cycle) {
        // Load all FEEDBACK forms for this cycle from the DB
        List<AppraisalForm> feedbackForms =
                formRepository.findByCycleCycleIdAndFormType(cycle.getCycleId(), FormType.FEEDBACK);

        Map<FeedbackRelationship, AppraisalForm> byRel = new EnumMap<>(FeedbackRelationship.class);
        AppraisalForm fallback = null;
        for (AppraisalForm f : feedbackForms) {
            if (f.getTargetRelationship() != null) {
                byRel.put(f.getTargetRelationship(), f);
            } else if (fallback == null) {
                fallback = f;
            }
        }
        // Fill missing slots with the generic fallback form (or the cycle's form list)
        if (fallback == null) {
            fallback = cycle.getForms().stream()
                    .filter(f -> f.getFormType() == FormType.FEEDBACK)
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException(
                        "Cycle " + cycle.getCycleId() + " has no FEEDBACK form. "
                      + "Create a feedback form in the form designer before generating requests."));
        }
        final AppraisalForm fb = fallback;
        for (FeedbackRelationship rel : FeedbackRelationship.values()) {
            byRel.putIfAbsent(rel, fb);
        }
        return byRel;
    }

    private void generateRequestsForEmployee(AppraisalCycle cycle, Employee target, Long cycleId, Long previousCycleId,
                                             int globalMaxLimit, java.util.Map<Long, Integer> workloadMap,
                                             java.util.Map<String, DepartmentFeedbackConfig> deptConfigs,
                                             boolean persist, List<FeedbackRequestResponse> previewResults,
                                             java.util.Map<Long, java.util.Set<Long>> excludedEvaluatorsMap,
                                             java.util.Map<FeedbackRelationship, AppraisalForm> formByRel) {
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
                case 4:
                    maxPeers = 2;
                    maxSubs = 3;
                    break;
                case 5:
                    maxPeers = 3;
                    maxSubs = 3;
                    break;
                case 6:
                    maxPeers = 3;
                    maxSubs = 4;
                    break;
                case 7:
                    maxPeers = 5;
                    maxSubs = 0;
                    break;
                default:
                    maxPeers = 3;
                    maxSubs = 3;
                    break;
            }
        }

        AppraisalForm selfForm    = formByRel.get(FeedbackRelationship.SELF);
        AppraisalForm managerForm = formByRel.get(FeedbackRelationship.DIRECT_MANAGER);
        AppraisalForm peerForm    = formByRel.get(FeedbackRelationship.PEER);
        AppraisalForm subForm     = formByRel.get(FeedbackRelationship.SUBORDINATE);

        // 1. SELF
        handleRequest(cycle, target, target, FeedbackRelationship.SELF, false, workloadMap, 999, persist, previewResults, true, selfForm);

        // 2. MANAGER / SUPERIOR
        if (rank == 4) {
            // L01-L03 evaluates L04 Head (Global Shuffle/Rotation)
            Employee rotationEval = evaluatorRotationService.assignTopManagementEvaluator(target.getId(), cycleId, previousCycleId);
            if (rotationEval != null) {
                handleRequest(cycle, target, rotationEval, FeedbackRelationship.DIRECT_MANAGER, false, workloadMap, globalMaxLimit, persist, previewResults, true, managerForm);
            } else {
                assignManager(cycle, target, workloadMap, globalMaxLimit, persist, previewResults, true, managerForm);
            }
        } else {
            // L05, L06, L07 Superiors must be in SAME DEPARTMENT
            assignManager(cycle, target, workloadMap, globalMaxLimit, persist, previewResults, true, managerForm);
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
            if (handleRequest(cycle, target, peer, FeedbackRelationship.PEER, true, workloadMap, globalMaxLimit, persist, previewResults, false, peerForm)) {
                pCount++;
            }
        }

        // PASS 2: Rotated & Reciprocal (List B - Fallback)
        if (pCount < maxPeers) {
            for (Employee peer : rotatedPeerPool) {
                if (pCount >= maxPeers) break;
                if (handleRequest(cycle, target, peer, FeedbackRelationship.PEER, true, workloadMap, globalMaxLimit, persist, previewResults, true, peerForm)) {
                    pCount++;
                }
            }
        }

        // PASS 3: Non-Rotated (Last Resort)
        if (pCount < maxPeers) {
            for (Employee p : peerPool) {
                if (pCount >= maxPeers) break;
                if (handleRequest(cycle, target, p, FeedbackRelationship.PEER, true, workloadMap, globalMaxLimit, persist, previewResults, true, peerForm)) {
                    pCount++;
                }
            }
        }

        // 4. SUBORDINATES — always use the authoritative direct-report relationship, with department fallback
        if (maxSubs > 0) {
            List<Employee> subPool = new ArrayList<>(findDirectReports(target));

            // Fallback to skip-level department junior employees if direct reports are insufficient
            if (subPool.size() < maxSubs) {
                List<Employee> deptSubs = findSubordinatesByDepartment(target);
                for (Employee ds : deptSubs) {
                    if (!subPool.contains(ds)) {
                        subPool.add(ds);
                    }
                }
            }

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
                if (handleRequest(cycle, target, sub, FeedbackRelationship.SUBORDINATE, true, workloadMap, globalMaxLimit, persist, previewResults, false, subForm)) {
                    sCount++;
                }
            }

            // PASS 2: Reciprocal Fallback
            if (sCount < maxSubs) {
                for (Employee sub : rotatedSubPool) {
                    if (sCount >= maxSubs) break;
                    if (handleRequest(cycle, target, sub, FeedbackRelationship.SUBORDINATE, true, workloadMap, globalMaxLimit, persist, previewResults, true, subForm)) {
                        sCount++;
                    }
                }
            }
        }
    }


    private boolean isEligibleEvaluator(Employee e) {
        if (e == null) return false;
        return Boolean.TRUE.equals(e.getIsActive())
                && e.getStatus() != ace.org.epms_backend.enums.EmployeeStatus.RESIGNED
                && e.getStatus() != ace.org.epms_backend.enums.EmployeeStatus.LONG_TERM_LEAVE
                && e.getStatus() != ace.org.epms_backend.enums.EmployeeStatus.TERMINATED;
    }

    private List<Employee> findPeersGlobal(Employee target) {
        int targetRank = getLevelRank(target);
        return employeeRepository.findAll().stream()
                .filter(e -> !e.getId().equals(target.getId()) && getLevelRank(e) == targetRank && isEligibleEvaluator(e))
                .collect(Collectors.toList());
    }

    private List<Employee> findSubordinatesGlobal(Employee target) {
        int targetRank = getLevelRank(target);
        return employeeRepository.findAll().stream()
                .filter(e -> getLevelRank(e) > targetRank && isEligibleEvaluator(e))
                .collect(Collectors.toList());
    }

    private void assignManager(AppraisalCycle cycle, Employee target, java.util.Map<Long, Integer> workloadMap, int limit, boolean persist, List<FeedbackRequestResponse> previewResults, boolean strictDept, AppraisalForm form) {
        reportingLineRepository.findByEmployeeAndIsActiveTrue(target)
                .ifPresent(line -> {
                    Employee manager = line.getManager();
                    if (!isEligibleEvaluator(manager)) return;
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
                    handleRequest(cycle, target, manager, FeedbackRelationship.DIRECT_MANAGER, false, workloadMap, limit, persist, previewResults, true, form);
                });
    }

    private boolean handleRequest(AppraisalCycle cycle, Employee target, Employee evaluator, FeedbackRelationship rel,
                                  boolean anon, java.util.Map<Long, Integer> workloadMap, int limit, boolean persist,
                                  List<FeedbackRequestResponse> previewResults, boolean allowReciprocal,
                                  AppraisalForm form) {
        if (target == null || evaluator == null) return false;

        // Skip if same person
        if (target.getId().equals(evaluator.getId()) && rel != FeedbackRelationship.SELF) return false;

        // Ensure evaluator is active and eligible
        if (!isEligibleEvaluator(evaluator)) return false;

        int currentWorkload = workloadMap.getOrDefault(evaluator.getId(), 0);
        if (currentWorkload >= limit) return false;

        // Anti-Reciprocal (Anti-Quid-Pro-Quo) Logic
        boolean isReciprocal = false;
        if (persist) {
            isReciprocal = requestRepository.existsByTargetUserIdAndEvaluatorIdAndCycleCycleId(evaluator.getId(), target.getId(), cycle.getCycleId());
        } else {
            isReciprocal = previewResults.stream()
                    .anyMatch(r -> r.getTargetUserId().equals(evaluator.getId()) && Objects.equals(r.getEvaluatorId(), target.getId()));
        }

        // List B logic: If it's reciprocal but we don't allow it in this pass, skip it
        if (isReciprocal && !allowReciprocal && rel == FeedbackRelationship.PEER) {
            return false;
        }

        if (!persist) {
            // Check if already in preview to avoid duplicates
            boolean existsInPreview = previewResults.stream()
                    .anyMatch(r -> r.getTargetUserId().equals(target.getId())
                            && Objects.equals(r.getEvaluatorId(), evaluator.getId()));
            if (existsInPreview) return false;

            String targetDept = departmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(target.getId())
                    .map(ed -> ed.getCurrentDepartment() != null ? ed.getCurrentDepartment().getDepartmentName() : "N/A")
                    .orElse("N/A");
            String evalDept = departmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(evaluator.getId())
                    .map(ed -> ed.getCurrentDepartment() != null ? ed.getCurrentDepartment().getDepartmentName() : "N/A")
                    .orElse("N/A");

            java.time.Instant dueDate = null;
            if (cycle.getSelfAssessmentDeadline() != null) {
                dueDate = cycle.getSelfAssessmentDeadline().atTime(23, 59, 59)
                        .atZone(java.time.ZoneId.systemDefault()).toInstant();
            } else if (cycle.getEndDate() != null) {
                dueDate = cycle.getEndDate().atTime(23, 59, 59)
                        .atZone(java.time.ZoneId.systemDefault()).toInstant();
            }

            boolean isOverdue = dueDate != null && dueDate.isBefore(java.time.Instant.now());

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
                    .dueDate(dueDate)
                    .startedAt(java.time.Instant.now())
                    .formId(form != null ? form.getFormId() : null)
                    .isOverdue(isOverdue)
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
                            .filter(e -> e != null && !e.getId().equals(employee.getId()) && getLevelRank(e) == targetRank && isEligibleEvaluator(e))
                            .collect(Collectors.toList());
                }).orElse(Collections.emptyList());
    }

    private List<Employee> findDirectReports(Employee target) {
        return reportingLineRepository.findAllByManagerAndIsActiveTrue(target).stream()
                .map(ace.org.epms_backend.model.employee.ReportingLine::getEmployee)
                .filter(e -> e != null && isEligibleEvaluator(e))
                .collect(Collectors.toList());
    }

    private List<Employee> findSubordinatesByDepartment(Employee target) {
        return departmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(target.getId())
                .map(ed -> {
                    if (ed.getCurrentDepartment() == null) return new java.util.ArrayList<Employee>();
                    int targetRank = getLevelRank(target);
                    return departmentRepository.findByCurrentDepartmentIdAndIsCurrentTrue(ed.getCurrentDepartment().getId())
                            .stream()
                            .map(ace.org.epms_backend.model.employee.EmployeeDepartment::getEmployee)
                            .filter(e -> e != null && !e.getId().equals(target.getId()) && getLevelRank(e) > targetRank && isEligibleEvaluator(e))
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
                            .filter(e -> e != null && !e.getId().equals(target.getId()) && getLevelRank(e) == targetRank && isEligibleEvaluator(e))
                            .collect(Collectors.toList()));
                });
        return teamPeers;
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
            java.time.Instant dueDate = null;
            if (cycle.getSelfAssessmentDeadline() != null) {
                dueDate = cycle.getSelfAssessmentDeadline().atTime(23, 59, 59)
                        .atZone(java.time.ZoneId.systemDefault()).toInstant();
            } else if (cycle.getEndDate() != null) {
                dueDate = cycle.getEndDate().atTime(23, 59, 59)
                        .atZone(java.time.ZoneId.systemDefault()).toInstant();
            }

            FeedbackRequest request = FeedbackRequest.builder()
                    .targetUser(target)
                    .evaluator(evaluator)
                    .cycle(cycle)
                    .relationship(rel)
                    .form(form)
                    .isAnonymous(anon)
                    .status(FeedbackStatus.PENDING)
                    .startedAt(java.time.Instant.now())
                    .dueDate(dueDate)
                    .build();
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
    public List<FeedbackRequestResponse> getMyRequests(Long evaluatorId) {
        return requestRepository.findByEvaluatorId(evaluatorId).stream()
                .map(feedbackMapper::toRequestResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void cancelFeedbackRequest(Long requestId) {
        FeedbackRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Feedback request not found: " + requestId));
        if (request.getStatus() == FeedbackStatus.COMPLETED) {
            throw new IllegalStateException("Cannot cancel a completed feedback request.");
        }
        Long viewerId = securityHelper.currentUserId();
        if (viewerId != null && viewerId.equals(request.getTargetUser().getId())
                && Boolean.TRUE.equals(request.getIsAnonymous())
                && (request.getRelationship() == FeedbackRelationship.PEER
                    || request.getRelationship() == FeedbackRelationship.SUBORDINATE)) {
            throw new IllegalStateException(
                    "You cannot cancel your own anonymous evaluators. Ask another HR member or admin.");
        }
        request.setStatus(FeedbackStatus.CANCELLED);
        requestRepository.save(request);

        eventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(request.getEvaluator().getId())
                .type(NotificationType.FEEDBACK_REQUESTED)
                .title("Feedback Request Cancelled")
                .message("The feedback request for "
                        + (Boolean.TRUE.equals(request.getIsAnonymous()) ? "a colleague" : request.getTargetUser().getStaffName())
                        + " has been cancelled.")
                .referenceType(ReferenceType.FEEDBACK)
                .referenceId(request.getId())
                .actionUrl("/feedback/my-pending")
                .build());
    }

    @Override
    @Transactional
    public void reassignFeedbackRequest(Long requestId, Long newEvaluatorId) {
        FeedbackRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Feedback request not found: " + requestId));
        Long viewerId = securityHelper.currentUserId();
        if (viewerId != null && viewerId.equals(request.getTargetUser().getId())
                && Boolean.TRUE.equals(request.getIsAnonymous())
                && (request.getRelationship() == FeedbackRelationship.PEER
                    || request.getRelationship() == FeedbackRelationship.SUBORDINATE)) {
            throw new IllegalStateException(
                    "You cannot reassign your own anonymous evaluators. Ask another HR member or admin.");
        }
        Employee newEvaluator = employeeRepository.findById(newEvaluatorId)
                .orElseThrow(() -> new NotFoundException("Employee not found: " + newEvaluatorId));

        Long oldEvaluatorId = request.getEvaluator().getId();
        
        // Notify the old evaluator that their request is reassigned/cancelled
        eventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(oldEvaluatorId)
                .type(NotificationType.FEEDBACK_REQUESTED)
                .title("Feedback Request Reassigned")
                .message("Your feedback request for "
                        + (Boolean.TRUE.equals(request.getIsAnonymous()) ? "a colleague" : request.getTargetUser().getStaffName())
                        + " has been reassigned to another employee.")
                .referenceType(ReferenceType.FEEDBACK)
                .referenceId(request.getId())
                .actionUrl("/feedback/my-pending")
                .build());

        request.setEvaluator(newEvaluator);
        request.setStatus(FeedbackStatus.PENDING);
        requestRepository.save(request);

        // Notify the new evaluator
        eventPublisher.publishEvent(NotificationEvent.builder()
                .recipientId(newEvaluator.getId())
                .type(NotificationType.FEEDBACK_REQUESTED)
                .title("Feedback Requested")
                .message("You have been requested to provide 360 feedback for "
                        + (Boolean.TRUE.equals(request.getIsAnonymous()) ? "a colleague" : request.getTargetUser().getStaffName())
                        + ".")
                .referenceType(ReferenceType.FEEDBACK)
                .referenceId(request.getId())
                .actionUrl("/feedback/my-pending")
                .build());
    }

    @Override
    public List<FeedbackRequestResponse> listByCycle(Long cycleId) {
        Long viewerId = securityHelper.currentUserId();
        return requestRepository.findByCycleCycleId(cycleId).stream()
                .map(req -> toMaskedRequestResponse(req, viewerId))
                .collect(Collectors.toList());
    }

    private FeedbackRequestResponse toMaskedRequestResponse(FeedbackRequest req, Long viewerId) {
        boolean mask = shouldMaskEvaluator(req, viewerId);
        String targetDept = departmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(req.getTargetUser().getId())
                .map(ed -> ed.getCurrentDepartment() != null ? ed.getCurrentDepartment().getDepartmentName() : "N/A")
                .orElse("N/A");
        String evalDept = mask ? null :
                departmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(req.getEvaluator().getId())
                        .map(ed -> ed.getCurrentDepartment() != null ? ed.getCurrentDepartment().getDepartmentName() : "N/A")
                        .orElse("N/A");
        boolean isOverdue = req.getDueDate() != null
                && req.getStatus() != FeedbackStatus.COMPLETED
                && req.getStatus() != FeedbackStatus.CANCELLED
                && req.getDueDate().isBefore(java.time.Instant.now());

        return FeedbackRequestResponse.builder()
                .id(req.getId())
                .targetUserId(req.getTargetUser().getId())
                .targetUserName(req.getTargetUser().getStaffName())
                .targetDepartmentName(targetDept)
                .evaluatorId(mask ? null : req.getEvaluator().getId())
                .evaluatorName(mask ? "Anonymous" : req.getEvaluator().getStaffName())
                .evaluatorDepartmentName(evalDept)
                .cycleId(req.getCycle().getCycleId())
                .relationship(req.getRelationship())
                .status(req.getStatus())
                .isAnonymous(req.getIsAnonymous())
                .dueDate(req.getDueDate())
                .startedAt(req.getStartedAt())
                .lastReminderSentAt(req.getLastReminderSentAt())
                .formId(req.getForm() != null ? req.getForm().getFormId() : null)
                .isOverdue(isOverdue)
                .build();
    }

    private FeedbackRequestResponse maskIfNeeded(FeedbackRequestResponse r, Long viewerId) {
        if (viewerId == null) return r;
        if (!viewerId.equals(r.getTargetUserId())) return r;
        if (!Boolean.TRUE.equals(r.getIsAnonymous())) return r;
        FeedbackRelationship rel = r.getRelationship();
        if (rel != FeedbackRelationship.PEER && rel != FeedbackRelationship.SUBORDINATE) return r;
        return r.toBuilder()
                .evaluatorId(null)
                .evaluatorName("Anonymous")
                .evaluatorDepartmentName(null)
                .build();
    }

    private static boolean shouldMaskEvaluator(FeedbackRequest req, Long viewerId) {
        if (viewerId == null) return false;
        if (!viewerId.equals(req.getTargetUser().getId())) return false;
        if (!Boolean.TRUE.equals(req.getIsAnonymous())) return false;
        FeedbackRelationship rel = req.getRelationship();
        return rel == FeedbackRelationship.PEER || rel == FeedbackRelationship.SUBORDINATE;
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
