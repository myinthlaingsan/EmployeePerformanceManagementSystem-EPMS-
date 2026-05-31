package ace.org.epms_backend.service.kpi.impl;

import ace.org.epms_backend.dto.kpi.KpiAuditLogResponse;
import ace.org.epms_backend.dto.kpi.OrgKpiHistoryResponse;
import ace.org.epms_backend.dto.kpi.OrgKpiHistorySummary;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.ReportingLine;
import ace.org.epms_backend.model.kpi.KpiHistoryLog;
import ace.org.epms_backend.repository.EmployeeDepartmentRepository;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.KpiAuditLogQueryRepository;
import ace.org.epms_backend.repository.employee.ReportingLineRepository;
import ace.org.epms_backend.service.kpi.KpiAuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class KpiAuditLogServiceImpl implements KpiAuditLogService {

    private final KpiAuditLogQueryRepository auditLogQueryRepo;
    private final EmployeeRepository employeeRepository;
    private final EmployeeDepartmentRepository employeeDepartmentRepo;
    private final ReportingLineRepository reportingLineRepo;

    @Override
    @Transactional(readOnly = true)
    public OrgKpiHistoryResponse getOrgWideHistory(Long cycleId, String action, int page, int size) {
        validateOrgAccess();
        Pageable pageable = PageRequest.of(page, size);
        Page<KpiHistoryLog> rawPage = auditLogQueryRepo.findOrgWideByFilters(cycleId, action, pageable);
        List<KpiAuditLogResponse> logs = rawPage.getContent().stream().map(this::resolveLog).toList();
        return OrgKpiHistoryResponse.builder()
            .summary(buildSummary(rawPage.getContent()))
            .logs(logs)
            .page(page)
            .size(size)
            .totalElements(rawPage.getTotalElements())
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public OrgKpiHistoryResponse getTeamHistory(Long cycleId, String action, int page, int size) {
        validateManagerAccess();
        Employee currentUser = getCurrentEmployee();
        Pageable pageable = PageRequest.of(page, size);
        Page<KpiHistoryLog> rawPage = auditLogQueryRepo.findTeamHistoryByFilters(currentUser.getId(), cycleId, action, pageable);
        List<KpiAuditLogResponse> logs = rawPage.getContent().stream().map(this::resolveLog).toList();
        return OrgKpiHistoryResponse.builder()
            .summary(buildSummary(rawPage.getContent()))
            .logs(logs)
            .page(page)
            .size(size)
            .totalElements(rawPage.getTotalElements())
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<KpiAuditLogResponse> getIndividualHistory(Long employeeId, Long cycleId) {
        validateIndividualAccess(employeeId);
        return auditLogQueryRepo.findByEmployeeAndCycle(employeeId, cycleId)
            .stream().map(this::resolveLog).toList();
    }

    // --- Helpers ---
    private KpiAuditLogResponse resolveLog(KpiHistoryLog h) {
        Employee emp = employeeRepository.findById(h.getEmployeeId()).orElse(null);
        String empName = emp != null ? emp.getStaffName() : "Unknown";
        String empCode = emp != null ? emp.getEmployeeCode() : "—";
        String changedByName = employeeRepository.findById(h.getChangedBy())
            .map(Employee::getStaffName).orElse("System");
        String deptName = employeeDepartmentRepo.findFirstByEmployeeIdAndIsCurrentTrue(h.getEmployeeId())
            .map(ed -> ed.getCurrentDepartment() != null ? ed.getCurrentDepartment().getDepartmentName() : "No Department")
            .orElse("No Department");
        return KpiAuditLogResponse.builder()
            .id(h.getId())
            .employeeId(h.getEmployeeId())
            .employeeCode(empCode)
            .employeeName(empName)
            .departmentName(deptName)
            .goalSetId(h.getGoalSetId())
            .itemId(h.getItemId())
            .action(h.getAction())
            .changeReason(h.getChangeReason())
            .changeDetails(h.getChangeDetails())
            .changedBy(h.getChangedBy())
            .changedByName(changedByName)
            .createdAt(h.getCreatedAt())
            .build();
    }

    private OrgKpiHistorySummary buildSummary(List<KpiHistoryLog> logs) {
        return OrgKpiHistorySummary.builder()
            .totalEvents(logs.size())
            .phasesOpened(logs.stream().filter(l -> "PHASE_OPENED".equals(l.getAction())).count())
            .phasesClosed(logs.stream().filter(l -> "PHASE_CLOSED".equals(l.getAction()) || "PHASE_LOCKED".equals(l.getAction())).count())
            .kpisApproved(logs.stream().filter(l -> "KPI_APPROVED".equals(l.getAction())).count())
            .kpisReverted(logs.stream().filter(l -> "KPI_REVERTED".equals(l.getAction())).count())
            .midCycleEvents(logs.stream().filter(l -> "MID_CYCLE_EVENT".equals(l.getAction())).count())
            .build();
    }

    private void validateOrgAccess() {
        boolean ok = SecurityContextHolder.getContext().getAuthentication().getAuthorities()
            .stream().anyMatch(a -> a.getAuthority().equals("ROLE_HR") || a.getAuthority().equals("ROLE_ADMIN"));
        if (!ok) throw new SecurityException("HR or Admin access required.");
    }

    private void validateManagerAccess() {
        boolean ok = SecurityContextHolder.getContext().getAuthentication().getAuthorities()
            .stream().anyMatch(a -> List.of("ROLE_MANAGER","ROLE_HR","ROLE_ADMIN").contains(a.getAuthority()));
        if (!ok) throw new SecurityException("Manager or HR access required.");
    }

    private void validateIndividualAccess(Long targetId) {
        Employee current = getCurrentEmployee();
        if (current.getId().equals(targetId)) return;
        boolean elevated = SecurityContextHolder.getContext().getAuthentication().getAuthorities()
            .stream().anyMatch(a -> List.of("ROLE_HR","ROLE_ADMIN","ROLE_MANAGER").contains(a.getAuthority()));
        if (!elevated) throw new SecurityException("Access denied.");
    }

    private Employee getCurrentEmployee() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return employeeRepository.findByEmail(email)
            .orElseThrow(() -> new NotFoundException("Current user not found"));
    }
}
