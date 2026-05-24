package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.kpi.KpiHistoryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KpiHistoryLogRepository extends JpaRepository<KpiHistoryLog, Long> {
    List<KpiHistoryLog> getAuditLogsByGoalSetId(Long goalSetId);
}
