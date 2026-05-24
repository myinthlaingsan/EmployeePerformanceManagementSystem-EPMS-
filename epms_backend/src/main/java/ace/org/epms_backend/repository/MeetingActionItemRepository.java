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
}
