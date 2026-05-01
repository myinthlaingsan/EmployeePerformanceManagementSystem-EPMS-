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
    public List<ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse> getHistoryByEmployee(Long employeeId) {
        Employee currentUser = authService.getCurrentUser();
        boolean privileged = isPrivileged(currentUser);

        return historyRepository.findByEmployee_IdOrManager_Id(employeeId, employeeId).stream()
                .filter(h -> privileged || 
                             (currentUser.getId().equals(h.getCreatedBy())) || 
                             (!Boolean.TRUE.equals(h.getIsPrivate()) && (currentUser.getId().equals(h.getEmployee().getId()) || (h.getManager() != null && currentUser.getId().equals(h.getManager().getId())))))
                .filter(h -> {
                    // If the target of history is not the employee of this record, 
                    // it means we are viewing the manager's history.
                    // In this case, we only want to show actions PERFORMED by that manager.
                    if (!h.getEmployee().getId().equals(employeeId)) {
                        Long actualPerformerId = h.getPerformer() != null ? h.getPerformer().getId() : h.getCreatedBy();
                        return employeeId.equals(actualPerformerId);
                    }
                    return true;
                })
                .map(h -> {
                    ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse res = historyMapper.toResponse(h);
                    if (res.getPerformerId() == null) {
                        res.setPerformerId(h.getCreatedBy());
                        // Fallback: if it was a manager action, we can use managerName
                        if (h.getManager() != null && h.getManager().getId().equals(h.getCreatedBy())) {
                            res.setPerformerName(h.getManager().getStaffName());
                        } else if (h.getEmployee().getId().equals(h.getCreatedBy())) {
                            res.setPerformerName(h.getEmployee().getStaffName());
                        }
                    }
                    return res;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse> getHistoryBySource(SourceType sourceType, Long sourceId) {
        Employee currentUser = authService.getCurrentUser();
        boolean privileged = isPrivileged(currentUser);

        return historyRepository.findBySourceTypeAndSourceId(sourceType, sourceId).stream()
                .filter(h -> privileged || (currentUser.getId().equals(h.getCreatedBy())) || 
                             (!Boolean.TRUE.equals(h.getIsPrivate()) && currentUser.getId().equals(h.getEmployee().getId())))
                .map(h -> historyMapper.toResponse(h))
                .collect(Collectors.toList());
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

    private boolean isPrivileged(Employee employee) {
        List<Role> roles = employeeRoleRepository.findRolesByEmployeeId(employee.getId());
        return roles.stream()
                .anyMatch(r -> r.getRoleName() == RoleType.ADMIN || r.getRoleName() == RoleType.HR);
    }
}
