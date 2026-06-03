package ace.org.epms_backend.scheduler.kpi;

import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.enums.CycleStatus;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.PhaseStatus;
import ace.org.epms_backend.enums.ReferenceType;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.kpi.KpiGoalPhase;
import ace.org.epms_backend.repository.KpiGoalPhaseRepository;
import ace.org.epms_backend.repository.employee.ReportingLineRepository;
import ace.org.epms_backend.model.employee.ReportingLine;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
public class KpiMidcycleScheduler {

    private final KpiGoalPhaseRepository phaseRepository;
    private final ReportingLineRepository reportingLineRepo;
    private final ApplicationEventPublisher eventPublisher;

    @Scheduled(cron = "${kpi.midcycle.scheduler.cron:0 0 1 * * ?}")
    public void checkPendingKpiAssignments() {
        LocalDate today = LocalDate.now();
        List<KpiGoalPhase> openPhases = phaseRepository.findAll().stream()
                .filter(p -> p.getStatus() == PhaseStatus.OPEN && p.getGoalSet() == null)
                .filter(p -> isCycleOpenForMidcycle(p.getCycle(), today))
                .toList();

        int alertThresholdDays = 3;

        for (KpiGoalPhase phase : openPhases) {
            if (ChronoUnit.DAYS.between(phase.getPhaseStartDate().toLocalDate(), today) >= alertThresholdDays) {
                Employee employee = phase.getEmployee();
                ReportingLine rl = reportingLineRepo.findByEmployeeAndIsActiveTrue(employee).orElse(null);
                if (rl != null && rl.getManager() != null) {
                    Employee manager = rl.getManager();
                    eventPublisher.publishEvent(NotificationEvent.builder()
                            .recipientId(manager.getId())
                            .senderId(1L) // system/admin notification
                            .type(NotificationType.KPI_ASSIGNED)
                            .title("Reminder: Assign Midcycle KPIs")
                            .message("Reminder: Please assign performance goals for " + employee.getStaffName() 
                                    + " for Phase " + phase.getPhaseNumber() + " which started on " + phase.getPhaseStartDate() + ".")
                            .referenceType(ReferenceType.KPI)
                            .referenceId(null)
                            .actionUrl("/kpi/management")
                            .build());
                }
            }
        }
    }

    private boolean isCycleOpenForMidcycle(AppraisalCycle cycle, LocalDate today) {
        if (cycle == null || cycle.getStartDate() == null || cycle.getEndDate() == null) {
            return false;
        }

        boolean active = Boolean.TRUE.equals(cycle.getIsActive());
        boolean inAllowedStatus = cycle.getStatus() == CycleStatus.PLANNING
                || cycle.getStatus() == CycleStatus.IN_PROGRESS
                || cycle.getStatus() == CycleStatus.EVALUATION;
        boolean todayInsideCycle = !today.isBefore(cycle.getStartDate()) && !today.isAfter(cycle.getEndDate());

        return active && inAllowedStatus && todayInsideCycle;
    }
}
