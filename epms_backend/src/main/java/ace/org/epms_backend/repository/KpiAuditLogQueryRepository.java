package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.kpi.KpiHistoryLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KpiAuditLogQueryRepository extends JpaRepository<KpiHistoryLog, Long> {

    // Org-wide: all employees, filtered by cycleId + optional action
    @Query("""
        SELECT h FROM KpiHistoryLog h
        WHERE h.goalSetId IN (
            SELECT g.id FROM KpiGoals g WHERE g.cycle.cycleId = :cycleId
        )
        AND (:action IS NULL OR h.action = :action)
        ORDER BY h.createdAt DESC
    """)
    Page<KpiHistoryLog> findOrgWideByFilters(
        @Param("cycleId") Long cycleId,
        @Param("action") String action,
        Pageable pageable
    );

    // Team-scoped: manager's direct reports only
    @Query("""
        SELECT h FROM KpiHistoryLog h
        WHERE h.employeeId IN (
            SELECT rl.employee.id FROM ReportingLine rl
            WHERE rl.manager.id = :managerId AND rl.isActive = true
        )
        AND h.goalSetId IN (
            SELECT g.id FROM KpiGoals g WHERE g.cycle.cycleId = :cycleId
        )
        AND (:action IS NULL OR h.action = :action)
        ORDER BY h.createdAt DESC
    """)
    Page<KpiHistoryLog> findTeamHistoryByFilters(
        @Param("managerId") Long managerId,
        @Param("cycleId") Long cycleId,
        @Param("action") String action,
        Pageable pageable
    );

    // Individual employee (used by enriched individual history)
    @Query("""
        SELECT h FROM KpiHistoryLog h
        WHERE h.employeeId = :employeeId
        AND h.goalSetId IN (
            SELECT g.id FROM KpiGoals g WHERE g.cycle.cycleId = :cycleId
        )
        ORDER BY h.createdAt DESC
    """)
    List<KpiHistoryLog> findByEmployeeAndCycle(
        @Param("employeeId") Long employeeId,
        @Param("cycleId") Long cycleId
    );
}
