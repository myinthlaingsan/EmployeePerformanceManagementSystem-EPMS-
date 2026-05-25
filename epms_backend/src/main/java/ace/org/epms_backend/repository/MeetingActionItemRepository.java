package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.continuous.MeetingActionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MeetingActionItemRepository extends JpaRepository<MeetingActionItem, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT ai FROM MeetingActionItem ai " +
           "JOIN ai.meeting m " +
           "WHERE m.status = 'PUBLISHED' AND ai.isDeleted = false " +
           "AND (:deptId IS NULL OR m.employee.id IN (" +
           "  SELECT ed.employee.id FROM EmployeeDepartment ed " +
           "  WHERE ed.currentDepartment.id = :deptId AND ed.isCurrent = true" +
           ")) " +
           "AND (:empId IS NULL OR m.employee.id = :empId OR m.manager.id = :empId)")
    java.util.List<MeetingActionItem> findAllByDepartmentOrEmployee(
            @org.springframework.data.repository.query.Param("deptId") Long deptId,
            @org.springframework.data.repository.query.Param("empId") Long empId);

    /**
     * Find all non-deleted action items that:
     *  - belong to a PUBLISHED meeting
     *  - have a dueDate strictly before today
     *  - are NOT yet DONE
     * Used by the daily overdue notification scheduler.
     */
    @org.springframework.data.jpa.repository.Query(
        "SELECT ai FROM MeetingActionItem ai " +
        "JOIN FETCH ai.meeting m " +
        "WHERE m.status = ace.org.epms_backend.enums.ContinuousStatus.PUBLISHED " +
        "AND ai.isDeleted = false " +
        "AND ai.dueDate IS NOT NULL " +
        "AND ai.dueDate < :today " +
        "AND ai.status <> ace.org.epms_backend.enums.ActionItemStatus.DONE")
    java.util.List<MeetingActionItem> findOverdueActionItems(
            @org.springframework.data.repository.query.Param("today") java.time.LocalDate today);
}
