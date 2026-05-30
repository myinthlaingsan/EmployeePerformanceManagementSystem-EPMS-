package ace.org.epms_backend.repository;

import ace.org.epms_backend.enums.KpiGoalStatus;
import ace.org.epms_backend.model.kpi.KpiGoals;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KpiGoalsRepository extends JpaRepository<KpiGoals, Long> {
        // Optional<KpiGoals> findByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(Long
        // employeeId, Long cycleId);
        @Query("SELECT k FROM KpiGoals k WHERE k.employee.id = :employeeId AND k.cycle.cycleId = :cycleId AND k.isCurrent = true " +
                        "AND (k.status IS NULL OR k.status <> ace.org.epms_backend.enums.KpiGoalStatus.ARCHIVED)")
        Optional<KpiGoals> findByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(
                        @Param("employeeId") Long employeeId,
                        @Param("cycleId") Long cycleId);

        @Query("SELECT k FROM KpiGoals k WHERE k.employee.id = :employeeId AND k.cycle.cycleId = :cycleId AND k.isCurrent = true " +
                        "AND (k.status IS NULL OR k.status <> ace.org.epms_backend.enums.KpiGoalStatus.ARCHIVED) " +
                        "ORDER BY k.createdAt DESC")
        List<KpiGoals> findAllByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(
                        @Param("employeeId") Long employeeId,
                        @Param("cycleId") Long cycleId);
        // Optional<KpiGoals> findByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(Long
        // employeeId, Long cycleId);

        @Query("SELECT k FROM KpiGoals k " +
                        "WHERE k.cycle.cycleId = :cycleId " +
                        "AND (:departmentId IS NULL OR EXISTS (" +
                        "    SELECT ed FROM EmployeeDepartment ed " +
                        "    WHERE ed.employee = k.employee " +
                        "    AND ed.currentDepartment.id = :departmentId " +
                        "    AND ed.isCurrent = true" +
                        ")) " +
                        "AND k.isCurrent = true " +
                        "AND (k.status IS NULL OR k.status <> ace.org.epms_backend.enums.KpiGoalStatus.ARCHIVED)")
        List<KpiGoals> findByCycleAndDepartment(@Param("cycleId") Long cycleId,
                        @Param("departmentId") Long departmentId);

        // Optional<KpiGoals> findByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(Long
        // employeeId, Long cycleId);
        // @Query("SELECT k FROM KpiGoals k WHERE k.employee.id = :employeeId AND
        // k.cycle.cycleId = :cycleId AND k.isCurrent = true")
        // Optional<KpiGoals> findByEmployeeIdAndAppraisalCycleIdAndIsCurrentTrue(
        // @Param("employeeId") Long employeeId,
        // @Param("cycleId") Long cycleId);

        List<KpiGoals> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);
        
        @Query("SELECT DISTINCT k FROM KpiGoals k LEFT JOIN FETCH k.items i LEFT JOIN FETCH i.category LEFT JOIN FETCH k.cycle LEFT JOIN FETCH k.employee LEFT JOIN FETCH k.manager WHERE k.employee.id = :employeeId ORDER BY k.createdAt DESC")
        List<KpiGoals> findByEmployeeIdOrderByCreatedAtDescWithItems(@Param("employeeId") Long employeeId);

        @Query("SELECT k FROM KpiGoals k WHERE (k.manager.id = :managerId OR k.employee.id IN " +
                        "(SELECT rl.employee.id FROM ReportingLine rl WHERE rl.manager.id = :managerId AND rl.isActive = true)) "
                        +
                        "AND k.cycle.cycleId = :cycleId AND k.isCurrent = true " +
                        "AND (k.status IS NULL OR k.status <> ace.org.epms_backend.enums.KpiGoalStatus.ARCHIVED)")
        List<KpiGoals> findTeamGoals(@Param("managerId") Long managerId, @Param("cycleId") Long cycleId);

        // @Query("SELECT k FROM KpiGoals k WHERE k.employee.id IN "+"(SELECT
        // ed.employee.id FROM EmployeeDepartment ed WHERE ed.currentDepartment.id =
        // :departmentId AND ed.isCurrent = true) "+"AND k.cycle.cycleId = :cycleId")

        // List<KpiGoals> findByDepartmentIdAndCycleId(@Param("departmentId") Long
        // departmentId,
        // @Param("cycleId") Long cycleId);

        // @Query("SELECT k FROM KpiGoals k " +
        // "WHERE k.cycle.cycleId = :cycleId " +
        // "AND (:departmentId IS NULL OR k.employee.id IN (" +
        // " SELECT ed.employee.id FROM EmployeeDepartment ed " +
        // " WHERE ed.currentDepartment.id = :departmentId " +
        // " AND ed.isCurrent = true" +
        // ")) " +
        // "AND k.isCurrent = true")
        // List<KpiGoals> findByCycleAndDepartment(@Param("cycleId") Long cycleId,
        // @Param("departmentId") Long departmentId);

        @Modifying
        @Query("UPDATE KpiGoals g SET g.isCurrent = false, g.status = 'ARCHIVED' " +
                        "WHERE g.employee.id = :employeeId AND g.cycle.cycleId = :cycleId AND g.isCurrent = true AND g.status = 'DRAFT'")
        void archiveExistingGoalSets(@Param("employeeId") Long employeeId, @Param("cycleId") Long cycleId);

        List<KpiGoals> findByCycle_CycleIdAndStatusInAndIsCurrentTrue(@Param("cycleId") Long cycleId, @Param("statuses") List<KpiGoalStatus> statuses);

        @Query("SELECT k FROM KpiGoals k WHERE k.employee.id IN " +
                        "(SELECT ed.employee.id FROM EmployeeDepartment ed WHERE ed.currentDepartment.id = :departmentId AND ed.isCurrent = true) "
                        +
                        "AND k.cycle.cycleId = :cycleId")
        List<KpiGoals> findByDepartmentIdAndCycleId(@Param("departmentId") Long departmentId,
                        @Param("cycleId") Long cycleId);
}
