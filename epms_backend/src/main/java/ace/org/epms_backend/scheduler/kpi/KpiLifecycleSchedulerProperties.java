package ace.org.epms_backend.scheduler.kpi;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "kpi.lifecycle.scheduler")
public class KpiLifecycleSchedulerProperties {

    private boolean enabled = true;
    private String cron = "0 0 * * * *";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getCron() {
        return cron;
    }

    public void setCron(String cron) {
        this.cron = cron;
    }
}
