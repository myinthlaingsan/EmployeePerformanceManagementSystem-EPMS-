package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.enums.SourceType;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.continuous.PerformanceHistoryMapper;
import ace.org.epms_backend.model.continuous.PerformanceHistory;
import ace.org.epms_backend.repository.PerformanceHistoryRepository;
import ace.org.epms_backend.service.PerformanceHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ace.org.epms_backend.service.AuthService;
import ace.org.epms_backend.repository.EmployeeRoleRepository;
import ace.org.epms_backend.repository.EmployeeDepartmentRepository;
import ace.org.epms_backend.enums.RoleType;
import ace.org.epms_backend.model.employee.Role;
import ace.org.epms_backend.model.employee.Employee;
import org.springframework.transaction.annotation.Transactional;
import ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse;
import ace.org.epms_backend.dto.continuous.MeetingActionItemResponse;
import ace.org.epms_backend.model.continuous.MeetingActionItem;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PerformanceHistoryServiceImpl implements PerformanceHistoryService {

    private final PerformanceHistoryRepository historyRepository;
    private final PerformanceHistoryMapper historyMapper;
    private final AuthService authService;
    private final EmployeeRoleRepository employeeRoleRepository;
    private final EmployeeDepartmentRepository employeeDepartmentRepository;
    private final ace.org.epms_backend.repository.MeetingActionItemRepository actionItemRepository;
    private final ace.org.epms_backend.mapper.continuous.MeetingActionItemMapper actionItemMapper;

    @Override
    public ace.org.epms_backend.dto.PagedResponse<ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse> getHistoryByEmployee(Long employeeId, SourceType sourceType, Boolean onlyByManager, int page, int size) {
        Employee currentUser = authService.getCurrentUser();
        if (!isAnyPrivileged(currentUser)) {
            throw new ace.org.epms_backend.exception.AccessDeniedException("Only Admin, HR, or Manager can view performance pulse.");
        }
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        boolean privileged = isPrivileged(currentUser);

        org.springframework.data.domain.Page<PerformanceHistory> historyPage = historyRepository.findByEmployeeAndOptionalSource(employeeId, sourceType, pageable);
        
        List<ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse> content = historyPage.getContent().stream()
                .filter(h -> {
                    if (Boolean.TRUE.equals(onlyByManager)) {
                        return currentUser.getId().equals(h.getCreatedBy()) || 
                               (h.getManager() != null && currentUser.getId().equals(h.getManager().getId())) ||
                               (h.getPerformer() != null && currentUser.getId().equals(h.getPerformer().getId()));
                    }
                    return privileged || 
                           (currentUser.getId().equals(h.getCreatedBy())) || 
                           (currentUser.getId().equals(h.getEmployee().getId()) || (h.getManager() != null && currentUser.getId().equals(h.getManager().getId())));
                })
                .filter(h -> {
                    // Filter logic:
                    // 1. If Mar is the employee (subject), she sees it (unless private and she's not creator).
                    // 2. If Mar is NOT the employee, she only sees it if she was the performer/creator (manager action log).
                    if (!h.getEmployee().getId().equals(employeeId)) {
                        Long actualPerformerId = h.getPerformer() != null ? h.getPerformer().getId() : h.getCreatedBy();
                        return employeeId.equals(actualPerformerId);
                    }
                    return true;
                })
                .map(this::mapToResponseWithFallback)
                .collect(Collectors.toList());

        return new ace.org.epms_backend.dto.PagedResponse<>(
                content,
                historyPage.getNumber(),
                historyPage.getSize(),
                historyPage.getTotalElements(),
                historyPage.getTotalPages(),
                historyPage.isLast()
        );
    }

    @Override
    public ace.org.epms_backend.dto.PagedResponse<ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse> getAllHistory(SourceType sourceType, Long departmentId, int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        Employee currentUser = authService.getCurrentUser();
        
        // Allow Managers to view their department pulse, or Admin/HR for global pulse
        if (!isAnyPrivileged(currentUser)) {
             throw new ace.org.epms_backend.exception.AccessDeniedException("Only Admin, HR, or Manager can view pulse timeline.");
        }

        Long finalDeptId = departmentId;
        boolean isPlainManager = isManager(currentUser) && !isPrivileged(currentUser);

        if (isPlainManager) {
            // Force manager to their own department
            finalDeptId = getEmployeeCurrentDepartmentId(currentUser.getId());
        } else if (finalDeptId == null && !isPrivileged(currentUser)) {
            throw new ace.org.epms_backend.exception.AccessDeniedException("Please select a department to view organizational history.");
        }

        org.springframework.data.domain.Page<PerformanceHistory> historyPage = historyRepository.findAllByOptionalSourceAndDepartment(sourceType, finalDeptId, pageable);

        List<ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse> content = historyPage.getContent().stream()
                .map(this::mapToResponseWithFallback)
                .collect(Collectors.toList());

        return new ace.org.epms_backend.dto.PagedResponse<>(
                content,
                historyPage.getNumber(),
                historyPage.getSize(),
                historyPage.getTotalElements(),
                historyPage.getTotalPages(),
                historyPage.isLast()
        );
    }

    private ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse mapToResponseWithFallback(PerformanceHistory h) {
        ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse res = historyMapper.toResponse(h);
        if (res.getPerformerId() == null) {
            res.setPerformerId(h.getCreatedBy());
            // Fallback: if it was a manager action, we can use managerName
            if (h.getManager() != null && h.getManager().getId().equals(h.getCreatedBy())) {
                res.setPerformerName(h.getManager().getStaffName());
            } else if (h.getEmployee() != null && h.getEmployee().getId().equals(h.getCreatedBy())) {
                res.setPerformerName(h.getEmployee().getStaffName());
            }
        }
        return res;
    }

    @Override
    public ace.org.epms_backend.dto.PagedResponse<ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse> getHistoryBySource(SourceType sourceType, Long sourceId, int page, int size) {
        Employee currentUser = authService.getCurrentUser();
        if (!isAnyPrivileged(currentUser)) {
            throw new ace.org.epms_backend.exception.AccessDeniedException("Only Admin, HR, or Manager can view performance pulse.");
        }
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        boolean privileged = isPrivileged(currentUser);

        org.springframework.data.domain.Page<PerformanceHistory> historyPage = historyRepository.findBySourceTypeAndSourceId(sourceType, sourceId, pageable);

        List<ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse> content = historyPage.getContent().stream()
                .filter(h -> privileged || (currentUser.getId().equals(h.getCreatedBy())) || 
                             (currentUser.getId().equals(h.getEmployee().getId())))
                .map(h -> historyMapper.toResponse(h))
                .collect(Collectors.toList());

        return new ace.org.epms_backend.dto.PagedResponse<>(
                content,
                historyPage.getNumber(),
                historyPage.getSize(),
                historyPage.getTotalElements(),
                historyPage.getTotalPages(),
                historyPage.isLast()
        );
    }

    @Override
    public ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse getHistoryById(Long historyId) {
        PerformanceHistory history = historyRepository.findById(historyId)
                .orElseThrow(() -> new NotFoundException("History not found"));
        
        Employee currentUser = authService.getCurrentUser();
        if (isPrivileged(currentUser)) {
            return historyMapper.toResponse(history);
        }
        
        // Both Manager/Creator and Employee can see
        if (!currentUser.getId().equals(history.getEmployee().getId()) && !currentUser.getId().equals(history.getCreatedBy())) {
            throw new NotFoundException("History not found");
        }
        
        return historyMapper.toResponse(history);
    }

    @Override
    public List<ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse> getHistoryByEmployeeRaw(Long employeeId) {
        return getHistoryByEmployeeRaw(employeeId, false);
    }

    @Override
    public List<ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse> getHistoryByEmployeeRaw(Long employeeId, Boolean onlyByManager) {
        Employee currentUser = authService.getCurrentUser();
        if (!isAnyPrivileged(currentUser)) {
            throw new ace.org.epms_backend.exception.AccessDeniedException("Only Admin, HR, or Manager can view performance pulse.");
        }
        boolean privileged = isPrivileged(currentUser);

        // findLatestStateByEmployee returns one row per (sourceType, sourceId) –
        // the most recent audit entry for that entity. This means:
        //   • feedbackType reflects the current value after any edits
        //   • deleted entities are already excluded by the query
        //   • no double-counting from update / delete audit rows
        return historyRepository.findLatestStateByEmployee(employeeId).stream()
                .filter(h -> {
                    if (Boolean.TRUE.equals(onlyByManager)) {
                        return currentUser.getId().equals(h.getCreatedBy()) ||
                               (h.getManager() != null && currentUser.getId().equals(h.getManager().getId())) ||
                               (h.getPerformer() != null && currentUser.getId().equals(h.getPerformer().getId()));
                    }
                    return privileged ||
                           currentUser.getId().equals(h.getCreatedBy()) ||
                           (currentUser.getId().equals(h.getEmployee().getId()) ||
                             (h.getManager() != null && currentUser.getId().equals(h.getManager().getId())));
                })
                .map(this::mapToResponseWithFallback)
                .collect(Collectors.toList());
    }

    @Override
    public List<ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse> getAllHistoryRaw(Long departmentId) {
        Employee currentUser = authService.getCurrentUser();
        
        // Allow Managers to view their department pulse, or Admin/HR for global pulse
        if (!isAnyPrivileged(currentUser)) {
             throw new ace.org.epms_backend.exception.AccessDeniedException("Only Admin, HR, or Manager can view pulse analytics.");
        }

        Long finalDeptId = departmentId;
        boolean isPlainManager = isManager(currentUser) && !isPrivileged(currentUser);

        if (isPlainManager) {
            // Force manager to their own department
            finalDeptId = getEmployeeCurrentDepartmentId(currentUser.getId());
        } else if (finalDeptId == null && !isPrivileged(currentUser)) {
            // If no department specified, only Admin/HR can see global pulse
            throw new ace.org.epms_backend.exception.AccessDeniedException("Please select a department to view analytics.");
        }

        List<PerformanceHistory> entities = (finalDeptId != null)
                ? historyRepository.findLatestStatesByDepartment(finalDeptId)
                : historyRepository.findAllLatestStates();

        return entities.stream()
                .map(this::mapToResponseWithFallback)
                .collect(Collectors.toList());
    }

    private Long getEmployeeCurrentDepartmentId(Long employeeId) {
        return employeeDepartmentRepository.findFirstByEmployeeIdAndIsCurrentTrue(employeeId)
                .map(ed -> ed.getCurrentDepartment().getId())
                .orElseThrow(() -> new ace.org.epms_backend.exception.AccessDeniedException("Employee is not assigned to any department."));
    }

    @Override
    public List<ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse> getPerformancePulse(Long departmentId, Long employeeId, Boolean onlyByManager) {
        if (employeeId != null) {
            // Security for employee-specific pulse is handled inside getHistoryByEmployeeRaw
            return getHistoryByEmployeeRaw(employeeId, onlyByManager);
        }
        // Security for department/global pulse is handled inside getAllHistoryRaw
        return getAllHistoryRaw(departmentId);
    }

    @Override
    public ace.org.epms_backend.dto.continuous.MeetingPulseResponse getMeetingPulse(Long departmentId, Long employeeId, Boolean onlyByManager) {
        Employee currentUser = authService.getCurrentUser();
        if (!isAnyPrivileged(currentUser)) {
            throw new ace.org.epms_backend.exception.AccessDeniedException("Only Admin, HR, or Manager can view pulse analytics.");
        }

        Long finalDeptId = departmentId;
        boolean isPlainManager = isManager(currentUser) && !isPrivileged(currentUser);
        if (isPlainManager) {
            finalDeptId = getEmployeeCurrentDepartmentId(currentUser.getId());
        }

        // 1. Get History
        // If employeeId is present, we are tracking specific manager/employee output -> Full Action History
        // If only departmentId is present, we are tracking organizational health -> Latest States (Pulse)
        List<PerformanceHistoryResponse> historyList;
        if (employeeId != null) {
            boolean selectedUserIsManager = employeeRoleRepository.findRolesByEmployeeId(employeeId).stream()
                    .anyMatch(r -> r.getRoleName() == RoleType.MANAGER);
            if (selectedUserIsManager) {
                historyList = historyRepository.findActionHistoryByPerformer(employeeId).stream()
                        .map(this::mapToResponseWithFallback)
                        .collect(Collectors.toList());
            } else {
                historyList = historyRepository.findActionHistoryByEmployee(employeeId).stream()
                        .map(this::mapToResponseWithFallback)
                        .collect(Collectors.toList());
            }
            if (Boolean.TRUE.equals(onlyByManager)) {
                historyList = historyList.stream()
                        .filter(h -> currentUser.getId().equals(h.getPerformerId()) || currentUser.getId().equals(h.getManagerId()))
                        .collect(Collectors.toList());
            }
        } else {
            historyList = getPerformancePulse(finalDeptId, null, false).stream()
                    .collect(Collectors.toList());
        }

        // 2. Filter for Meetings
        List<PerformanceHistoryResponse> meetingHistory = historyList.stream()
                .filter(h -> h.getSourceType() == SourceType.MEETING)
                .collect(Collectors.toList());

        // 3. Get Action Items
        List<MeetingActionItem> actionItems = actionItemRepository.findAllByDepartmentOrEmployee(finalDeptId, employeeId);
        if (employeeId != null && Boolean.TRUE.equals(onlyByManager)) {
            actionItems = actionItems.stream()
                    .filter(ai -> ai.getMeeting() != null && 
                            (currentUser.getId().equals(ai.getMeeting().getCreatedBy()) || 
                             (ai.getMeeting().getManager() != null && currentUser.getId().equals(ai.getMeeting().getManager().getId()))))
                    .collect(Collectors.toList());
        }
        
        long totalActionItems = actionItems.size();
        long completedActionItems = actionItems.stream()
                .filter(ai -> ai.getStatus() == ace.org.epms_backend.enums.ActionItemStatus.DONE)
                .count();

        List<MeetingActionItemResponse> actionItemResponses = actionItems.stream()
                .map(actionItemMapper::toResponse)
                .collect(Collectors.toList());

        return ace.org.epms_backend.dto.continuous.MeetingPulseResponse.builder()
                .totalActionItems(totalActionItems)
                .completedActionItems(completedActionItems)
                .meetingHistory(meetingHistory)
                .actionHistory(historyList) // The full, non-deduplicated history list
                .actionItems(actionItemResponses)
                .build();
    }

    private boolean isPrivileged(Employee employee) {
        List<Role> roles = employeeRoleRepository.findRolesByEmployeeId(employee.getId());
        return roles.stream()
                .anyMatch(r -> r.getRoleName() == RoleType.ADMIN || r.getRoleName() == RoleType.HR);
    }

    private boolean isAnyPrivileged(Employee employee) {
        List<Role> roles = employeeRoleRepository.findRolesByEmployeeId(employee.getId());
        return roles.stream()
                .anyMatch(r -> r.getRoleName() == RoleType.ADMIN || 
                             r.getRoleName() == RoleType.HR || 
                             r.getRoleName() == RoleType.MANAGER);
    }

    private boolean isManager(Employee employee) {
        List<Role> roles = employeeRoleRepository.findRolesByEmployeeId(employee.getId());
        return roles.stream()
                .anyMatch(r -> r.getRoleName() == RoleType.MANAGER);
    }
}
