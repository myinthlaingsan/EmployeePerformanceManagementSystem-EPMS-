package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.kpi.KpiProgress;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface KpiProgressRepository extends JpaRepository<KpiProgress, Long> {
    List<KpiProgress> findByGoalItemIdOrderByIdDesc(Long goalItemId);
    List<KpiProgress> findByGoalItemGoalSetEmployeeIdOrderByIdDesc(Long employeeId);

    @Query("SELECT p FROM KpiProgress p WHERE p.goalItem.goalSet.employee.id = :employeeId AND p.goalItem.goalSet.isCurrent = true ORDER BY p.id DESC")
    List<KpiProgress> findCurrentProgressByEmployeeId(@Param("employeeId") Long employeeId, Pageable pageable);
}
