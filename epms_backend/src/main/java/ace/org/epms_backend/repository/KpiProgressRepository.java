package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.kpi.KpiProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface KpiProgressRepository extends JpaRepository<KpiProgress, Long> {
    List<KpiProgress> findByGoalItemIdOrderByIdDesc(Long goalItemId);
    List<KpiProgress> findByGoalItemGoalSetEmployeeIdOrderByIdDesc(Long employeeId);
}
