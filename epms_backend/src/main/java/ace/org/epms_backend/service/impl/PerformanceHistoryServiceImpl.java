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
import ace.org.epms_backend.enums.RoleType;
import ace.org.epms_backend.model.employee.Role;
import ace.org.epms_backend.model.employee.Employee;
import org.springframework.transaction.annotation.Transactional;

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

    @Override
    public ace.org.epms_backend.dto.PagedResponse<ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse> getHistoryByEmployee(Long employeeId, SourceType sourceType, int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        Employee currentUser = authService.getCurrentUser();
        boolean privileged = isPrivileged(currentUser);

        org.springframework.data.domain.Page<PerformanceHistory> historyPage = historyRepository.findByEmployeeAndOptionalSource(employeeId, sourceType, pageable);
        
        List<ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse> content = historyPage.getContent().stream()
                .filter(h -> privileged || 
                             (currentUser.getId().equals(h.getCreatedBy())) || 
                             (!Boolean.TRUE.equals(h.getIsPrivate()) && (currentUser.getId().equals(h.getEmployee().getId()) || (h.getManager() != null && currentUser.getId().equals(h.getManager().getId())))))
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
    public ace.org.epms_backend.dto.PagedResponse<ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse> getAllHistory(SourceType sourceType, int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        Employee currentUser = authService.getCurrentUser();
        if (!isPrivileged(currentUser)) {
            throw new ace.org.epms_backend.exception.AccessDeniedException("Only Admin or HR can view global pulse.");
        }

        org.springframework.data.domain.Page<PerformanceHistory> historyPage = historyRepository.findAllByOptionalSource(sourceType, pageable);

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
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        Employee currentUser = authService.getCurrentUser();
        boolean privileged = isPrivileged(currentUser);

        org.springframework.data.domain.Page<PerformanceHistory> historyPage = historyRepository.findBySourceTypeAndSourceId(sourceType, sourceId, pageable);

        List<ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse> content = historyPage.getContent().stream()
                .filter(h -> privileged || (currentUser.getId().equals(h.getCreatedBy())) || 
                             (!Boolean.TRUE.equals(h.getIsPrivate()) && currentUser.getId().equals(h.getEmployee().getId())))
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
        
        // If private, only Manager/Creator can see
        if (Boolean.TRUE.equals(history.getIsPrivate())) {
            if (!currentUser.getId().equals(history.getCreatedBy())) {
                throw new NotFoundException("History not found");
            }
        } else {
            // If not private, both Manager/Creator and Employee can see
            if (!currentUser.getId().equals(history.getEmployee().getId()) && !currentUser.getId().equals(history.getCreatedBy())) {
                throw new NotFoundException("History not found");
            }
        }
        
        return historyMapper.toResponse(history);
    }

    @Override
    public List<ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse> getHistoryByEmployeeRaw(Long employeeId) {
        Employee currentUser = authService.getCurrentUser();
        boolean privileged = isPrivileged(currentUser);

        // findLatestStateByEmployee returns one row per (sourceType, sourceId) –
        // the most recent audit entry for that entity. This means:
        //   • feedbackType reflects the current value after any edits
        //   • deleted entities are already excluded by the query
        //   • no double-counting from update / delete audit rows
        return historyRepository.findLatestStateByEmployee(employeeId).stream()
                .filter(h -> privileged ||
                             currentUser.getId().equals(h.getCreatedBy()) ||
                             (!Boolean.TRUE.equals(h.getIsPrivate()) &&
                              (currentUser.getId().equals(h.getEmployee().getId()) ||
                               (h.getManager() != null && currentUser.getId().equals(h.getManager().getId())))))
                .map(this::mapToResponseWithFallback)
                .collect(Collectors.toList());
    }

    @Override
    public List<ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse> getAllHistoryRaw() {
        Employee currentUser = authService.getCurrentUser();
        if (!isPrivileged(currentUser)) {
            throw new ace.org.epms_backend.exception.AccessDeniedException("Only Admin or HR can view global pulse.");
        }

        // findAllLatestStates returns one row per (sourceType, sourceId) –
        // the most recent audit entry. feedbackType is always up-to-date.
        return historyRepository.findAllLatestStates().stream()
                .map(this::mapToResponseWithFallback)
                .collect(Collectors.toList());
    }

    private boolean isPrivileged(Employee employee) {
        List<Role> roles = employeeRoleRepository.findRolesByEmployeeId(employee.getId());
        return roles.stream()
                .anyMatch(r -> r.getRoleName() == RoleType.ADMIN || r.getRoleName() == RoleType.HR);
    }
}
