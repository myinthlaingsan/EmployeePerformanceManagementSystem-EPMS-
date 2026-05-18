package ace.org.epms_backend.repository.feedback360;

import ace.org.epms_backend.model.employee.Department;
import ace.org.epms_backend.model.employee.JobLevel;
import ace.org.epms_backend.model.feedback360.DepartmentFeedbackConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentFeedbackConfigRepository extends JpaRepository<DepartmentFeedbackConfig, Long> {
    Optional<DepartmentFeedbackConfig> findByDepartmentAndJobLevelAndIsActiveTrue(Department department, JobLevel jobLevel);
    Optional<DepartmentFeedbackConfig> findByIsDefaultTrueAndIsActiveTrue();
    List<DepartmentFeedbackConfig> findByDepartmentId(Long departmentId);
}
