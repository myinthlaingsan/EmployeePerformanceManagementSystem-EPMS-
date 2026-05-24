package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.kpi.KpiGoalItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface KpiGoalItemRepository extends JpaRepository<KpiGoalItem, Long> {
    List<KpiGoalItem> findByGoalSetIdAndIsActiveTrue(Long goalSetId);
}
