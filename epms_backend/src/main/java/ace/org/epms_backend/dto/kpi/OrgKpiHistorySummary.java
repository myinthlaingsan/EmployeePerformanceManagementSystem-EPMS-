package ace.org.epms_backend.dto.kpi;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrgKpiHistorySummary {
    private long totalEvents;
    private long phasesOpened;
    private long phasesClosed;
    private long kpisApproved;
    private long kpisReverted;
    private long midCycleEvents;
}
