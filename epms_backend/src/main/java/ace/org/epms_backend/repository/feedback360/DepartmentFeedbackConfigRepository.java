package ace.org.epms_backend.repository.feedback360;

import ace.org.epms_backend.model.feedback360.DepartmentFeedbackConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentFeedbackConfigRepository extends JpaRepository<DepartmentFeedbackConfig, Long> {
    Optional<DepartmentFeedbackConfig> findByDepartmentIdAndJobLevelLevelId(Long departmentId, Long jobLevelId);
    List<DepartmentFeedbackConfig> findByDepartmentId(Long departmentId);
}
