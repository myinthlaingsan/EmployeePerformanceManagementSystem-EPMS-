package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.dashboard.*;
import ace.org.epms_backend.enums.AppraisalStatus;
import ace.org.epms_backend.model.appraisal.Appraisal;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final AppraisalRepository appraisalRepo;
    private final EmployeeRepository employeeRepo;
    private final AppraisalCycleRepository cycleRepo;

    @Override
    public EmployeeDashboardResponse getEmployeeDashboard(Long employeeId) {
        List<Appraisal> appraisals = appraisalRepo.findByEmployee_Id(employeeId);
        
        long pending = appraisals.stream()
                .filter(a -> a.getStatus() != AppraisalStatus.ARCHIVED)
                .count();
        
        long completed = appraisals.stream()
                .filter(a -> a.getStatus() == AppraisalStatus.ARCHIVED)
                .count();

        List<EmployeeDashboardResponse.AppraisalSummary> active = appraisals.stream()
                .filter(a -> a.getStatus() != AppraisalStatus.ARCHIVED)
                .map(a -> EmployeeDashboardResponse.AppraisalSummary.builder()
                        .appraisalId(a.getAppraisalId())
                        .cycleName(a.getCycle().getCycleName())
                        .status(a.getStatus().name())
                        .build())
                .collect(Collectors.toList());

        return EmployeeDashboardResponse.builder()
                .pendingAppraisals((int) pending)
                .completedAppraisals((int) completed)
                .activeAppraisals(active)
                .build();
    }

    @Override
    public ManagerDashboardResponse getManagerDashboard(Long managerId) {
        List<Appraisal> teamAppraisals = appraisalRepo.findByManager_Id(managerId);

        long toEvaluate = teamAppraisals.stream()
                .filter(a -> a.getStatus() == AppraisalStatus.SELF_ASSESSED || a.getStatus() == AppraisalStatus.PENDING)
                .count();

        long completed = teamAppraisals.stream()
                .filter(a -> a.getStatus() == AppraisalStatus.EVALUATED || a.getStatus() == AppraisalStatus.ARCHIVED)
                .count();

        List<ManagerDashboardResponse.TeamAppraisalSummary> list = teamAppraisals.stream()
                .map(a -> ManagerDashboardResponse.TeamAppraisalSummary.builder()
                        .appraisalId(a.getAppraisalId())
                        .staffName(a.getEmployee().getStaffName())
                        .employeeCode(a.getEmployee().getEmployeeCode())
                        .status(a.getStatus().name())
                        .build())
                .collect(Collectors.toList());

        return ManagerDashboardResponse.builder()
                .appraisalsToEvaluate((int) toEvaluate)
                .completedEvaluations((int) completed)
                .teamAppraisals(list)
                .build();
    }

    @Override
    public AdminDashboardResponse getAdminDashboard() {
        long totalEmployees = employeeRepo.count();
        long activeCycles = cycleRepo.count(); // Simplified
        long totalAppraisals = appraisalRepo.count();

        Map<String, Long> statusCounts = appraisalRepo.findAll().stream()
                .collect(Collectors.groupingBy(a -> a.getStatus().name(), Collectors.counting()));

        Double avgScore = appraisalRepo.findAll().stream()
                .filter(a -> a.getTotalScore() != null)
                .mapToDouble(a -> a.getTotalScore().doubleValue())
                .average()
                .orElse(0.0);

        return AdminDashboardResponse.builder()
                .totalEmployees(totalEmployees)
                .activeCycles(activeCycles)
                .totalAppraisals(totalAppraisals)
                .statusCounts(statusCounts)
                .overallAverageScore(avgScore)
                .build();
    }
}
