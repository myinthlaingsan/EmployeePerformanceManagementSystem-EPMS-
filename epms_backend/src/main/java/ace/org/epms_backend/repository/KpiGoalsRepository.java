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
//    Optional<KpiGoals> findByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(Long employeeId, Long cycleId);
@Query("SELECT k FROM KpiGoals k WHERE k.employee.id = :employeeId AND k.cycle.cycleId = :cycleId AND k.isCurrent = true")
Optional<KpiGoals> findByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(
        @Param("employeeId") Long employeeId,
        @Param("cycleId") Long cycleId
);

    List<KpiGoals> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);

    @Query("SELECT k FROM KpiGoals k WHERE (k.manager.id = :managerId OR k.employee.id IN " +
           "(SELECT rl.employee.id FROM ReportingLine rl WHERE rl.manager.id = :managerId AND rl.isActive = true)) " +
           "AND k.cycle.cycleId = :cycleId AND k.isCurrent = true")
    List<KpiGoals> findTeamGoals(@Param("managerId") Long managerId, @Param("cycleId") Long cycleId);

    @Query("SELECT k FROM KpiGoals k WHERE k.employee.id IN " +
           "(SELECT ed.employee.id FROM EmployeeDepartment ed WHERE ed.currentDepartment.id = :departmentId AND ed.isCurrent = true) " +
           "AND k.cycle.cycleId = :cycleId")
    List<KpiGoals> findByDepartmentIdAndCycleId(@Param("departmentId") Long departmentId, @Param("cycleId") Long cycleId);
}
