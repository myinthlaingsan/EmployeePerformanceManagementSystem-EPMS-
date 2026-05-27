package ace.org.epms_backend.scheduler.kpi;

import ace.org.epms_backend.service.kpi.lifecycle.KpiGoalLifecycleService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class KpiGoalLifecycleScheduler {

    private final KpiLifecycleSchedulerProperties schedulerProperties;
    private final KpiGoalLifecycleService lifecycleService;

    @EventListener(ApplicationReadyEvent.class)
    public void runKpiLifecycleOnStartup() {
        runKpiLifecycle();
    }

    @Scheduled(cron = "${kpi.lifecycle.scheduler.cron:0 0 * * * *}")
    public void runKpiLifecycle() {
        if (!schedulerProperties.isEnabled()) {
            return;
        }
        try {
            lifecycleService.runLifecycle(LocalDate.now());
        } catch (RuntimeException ignored) {
            // Silent by requirement.
        }
    }
}
