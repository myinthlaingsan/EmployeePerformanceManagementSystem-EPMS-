package ace.org.epms_backend.repository;

import ace.org.epms_backend.enums.SourceType;
import ace.org.epms_backend.model.continuous.PerformanceHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PerformanceHistoryRepository extends JpaRepository<PerformanceHistory, Long> {

    @Query("SELECT h FROM PerformanceHistory h WHERE " +
           "(h.employee.id = :id OR h.manager.id = :id OR h.performer.id = :id OR h.createdBy = :id) " +
           "AND (:sourceType IS NULL OR h.sourceType = :sourceType)")
    Page<PerformanceHistory> findByEmployeeAndOptionalSource(
            @Param("id") Long id,
            @Param("sourceType") SourceType sourceType,
            Pageable pageable);

    @Query("SELECT h FROM PerformanceHistory h " +
           "LEFT JOIN EmployeeDepartment ed ON ed.employee.id = h.employee.id " +
           "WHERE (:sourceType IS NULL OR h.sourceType = :sourceType) " +
           "AND (:deptId IS NULL OR (ed.currentDepartment.id = :deptId AND ed.isCurrent = true))")
    Page<PerformanceHistory> findAllByOptionalSourceAndDepartment(
            @Param("sourceType") SourceType sourceType,
            @Param("deptId") Long deptId,
            Pageable pageable);

    Page<PerformanceHistory> findBySourceTypeAndSourceId(SourceType sourceType, Long sourceId, Pageable pageable);

    /**
     * Chart analytics — employee scope.
     *
     * Returns the single LATEST PerformanceHistory row per (sourceType, sourceId)
     * that involves this employee (as subject, manager, performer, or creator).
     *
     * Using MAX(historyId) as the tiebreaker gives us the most-recent audit row,
     * which carries the up-to-date feedbackType after any edits.
     *
     * Rows whose title is 'Feedback Deleted' or 'Meeting Deleted' are excluded so
     * that soft-deleted entities are not counted in the chart.
     *
     * The query returns one row per unique entity → no double-counting.
     */
    @Query("SELECT h FROM PerformanceHistory h WHERE " +
           "h.historyId IN (" +
           "  SELECT MAX(h2.historyId) FROM PerformanceHistory h2 " +
           "  WHERE h2.employee.id = :id OR h2.manager.id = :id " +
           "     OR h2.performer.id = :id OR h2.createdBy = :id " +
           "  GROUP BY h2.sourceType, h2.sourceId" +
           ") " +
           "AND h.title <> 'Feedback Deleted' " +
           "AND h.title <> 'Meeting Deleted' " +
           "AND (" +
           "  (h.sourceType = ace.org.epms_backend.enums.SourceType.FEEDBACK AND EXISTS (" +
           "    SELECT 1 FROM ContinuousFeedback f WHERE f.feedbackId = h.sourceId " +
           "    AND f.status = ace.org.epms_backend.enums.ContinuousStatus.PUBLISHED" +
           "  )) OR " +
           "  (h.sourceType = ace.org.epms_backend.enums.SourceType.MEETING AND EXISTS (" +
           "    SELECT 1 FROM OneOnOneMeeting m WHERE m.meetingId = h.sourceId " +
           "    AND m.status = ace.org.epms_backend.enums.ContinuousStatus.PUBLISHED" +
           "  ))" +
           ") " +
           "ORDER BY h.createdAt ASC")
    List<PerformanceHistory> findLatestStateByEmployee(@Param("id") Long id);

    /**
     * Chart analytics — global (Admin / HR) scope.
     *
     * Same logic as above but across the entire organisation.
     */
    @Query("SELECT h FROM PerformanceHistory h WHERE " +
           "h.historyId IN (" +
           "  SELECT MAX(h2.historyId) FROM PerformanceHistory h2 " +
           "  GROUP BY h2.sourceType, h2.sourceId" +
           ") " +
           "AND h.title <> 'Feedback Deleted' " +
           "AND h.title <> 'Meeting Deleted' " +
           "AND (" +
           "  (h.sourceType = ace.org.epms_backend.enums.SourceType.FEEDBACK AND EXISTS (" +
           "    SELECT 1 FROM ContinuousFeedback f WHERE f.feedbackId = h.sourceId " +
           "    AND f.status = ace.org.epms_backend.enums.ContinuousStatus.PUBLISHED" +
           "  )) OR " +
           "  (h.sourceType = ace.org.epms_backend.enums.SourceType.MEETING AND EXISTS (" +
           "    SELECT 1 FROM OneOnOneMeeting m WHERE m.meetingId = h.sourceId " +
           "    AND m.status = ace.org.epms_backend.enums.ContinuousStatus.PUBLISHED" +
           "  ))" +
           ") " +
           "ORDER BY h.createdAt ASC")
    List<PerformanceHistory> findAllLatestStates();

    @Query("SELECT h FROM PerformanceHistory h " +
           "JOIN EmployeeDepartment ed ON ed.employee.id = h.employee.id " +
           "WHERE h.historyId IN (" +
           "  SELECT MAX(h2.historyId) FROM PerformanceHistory h2 " +
           "  GROUP BY h2.sourceType, h2.sourceId" +
           ") " +
           "AND ed.currentDepartment.id = :deptId " +
           "AND ed.isCurrent = true " +
           "AND h.title <> 'Feedback Deleted' " +
           "AND h.title <> 'Meeting Deleted' " +
           "AND (" +
           "  (h.sourceType = ace.org.epms_backend.enums.SourceType.FEEDBACK AND EXISTS (" +
           "    SELECT 1 FROM ContinuousFeedback f WHERE f.feedbackId = h.sourceId " +
           "    AND f.status = ace.org.epms_backend.enums.ContinuousStatus.PUBLISHED" +
           "  )) OR " +
           "  (h.sourceType = ace.org.epms_backend.enums.SourceType.MEETING AND EXISTS (" +
           "    SELECT 1 FROM OneOnOneMeeting m WHERE m.meetingId = h.sourceId " +
           "    AND m.status = ace.org.epms_backend.enums.ContinuousStatus.PUBLISHED" +
           "  ))" +
           ") " +
           "ORDER BY h.createdAt ASC")
    List<PerformanceHistory> findLatestStatesByDepartment(@Param("deptId") Long deptId);
    
    /**
     * Activity History — Performer scope.
     * Returns the full audit trail of actions performed by a specific manager/employee.
     * Unlike the 'Latest State' queries, this does NOT deduplicate by sourceId,
     * ensuring every distinct action (like re-opening multiple items) is counted.
     */
    @Query("SELECT h FROM PerformanceHistory h WHERE " +
           "(h.performer.id = :id OR h.createdBy = :id) " +
           "AND h.title <> 'Feedback Deleted' " +
           "AND h.title <> 'Meeting Deleted' " +
           "ORDER BY h.createdAt ASC")
    List<PerformanceHistory> findActionHistoryByPerformer(@Param("id") Long id);
}
