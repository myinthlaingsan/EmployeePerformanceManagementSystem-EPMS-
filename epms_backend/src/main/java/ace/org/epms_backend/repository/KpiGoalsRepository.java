package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.kpi.KpiGoals;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface KpiGoalsRepository extends JpaRepository<KpiGoals, Long> {
    Optional<KpiGoals> findByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(Long employeeId, Long cycleId);
}
