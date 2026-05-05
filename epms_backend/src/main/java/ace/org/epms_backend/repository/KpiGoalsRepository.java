package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.kpi.KpiGoals;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KpiGoalsRepository extends JpaRepository<KpiGoals, Long> {
    // Optional<KpiGoals> findByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(Long
    // employeeId, Long cycleId);
    @Query("SELECT k FROM KpiGoals k WHERE k.employee.id = :employeeId AND k.cycle.cycleId = :cycleId AND k.isCurrent = true")
    Optional<KpiGoals> findByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(
            @Param("employeeId") Long employeeId,
            @Param("cycleId") Long cycleId);

    @Query("SELECT k FROM KpiGoals k " +
            "WHERE k.cycle.cycleId = :cycleId " +
            "AND (:departmentId IS NULL OR EXISTS (" +
            "    SELECT ed FROM EmployeeDepartment ed " +
            "    WHERE ed.employee = k.employee " +
            "    AND ed.currentDepartment.id = :departmentId " +
            "    AND ed.isCurrent = true" +
            ")) " +
            "AND k.isCurrent = true")
    List<KpiGoals> findByCycleAndDepartment(@Param("cycleId") Long cycleId, @Param("departmentId") Long departmentId);
}
