package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.employee.JobLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface JobLevelRepository extends JpaRepository<JobLevel, Long> {
    boolean existsByLevelCode(String levelCode);

    boolean existsByLevelRank(Integer levelRank);

    @Query("SELECT DISTINCT jl FROM JobLevel jl " +
           "JOIN Employee e ON e.level.levelId = jl.levelId " +
           "JOIN EmployeeDepartment ed ON ed.employee.id = e.id " +
           "WHERE ed.currentDepartment.id = :deptId AND ed.isCurrent = true")
    List<JobLevel> findLevelsByDepartmentId(@Param("deptId") Long deptId);
}
