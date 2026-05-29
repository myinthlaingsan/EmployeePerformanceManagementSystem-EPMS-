package ace.org.epms_backend.events;

import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;
import ace.org.epms_backend.model.kpi.KpiGoals;
import ace.org.epms_backend.repository.KpiGoalsRepository;
import ace.org.epms_backend.service.kpi.KpiMidcycleService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class KpiGoalAssignmentListener {

    private final KpiMidcycleService midcycleService;
    private final KpiGoalsRepository goalsRepository;

    @EventListener
    public void onKpiAssigned(NotificationEvent event) {
        if (event.getType() == NotificationType.KPI_ASSIGNED && event.getReferenceType() == ReferenceType.KPI) {
            Long goalSetId = event.getReferenceId();
            if (goalSetId != null) {
                goalsRepository.findById(goalSetId).ifPresent(goalSet -> {
                    if (goalSet.getEmployee() != null && goalSet.getCycle() != null) {
                        midcycleService.linkGoalSetToOpenPhase(
                                goalSet.getEmployee().getId(),
                                goalSet.getCycle().getCycleId(),
                                goalSetId
                        );
                    }
                });
            }
        }
    }
}
