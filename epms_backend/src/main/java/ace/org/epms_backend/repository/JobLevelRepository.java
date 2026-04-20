package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.employee.JobLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JobLevelRepository extends JpaRepository<JobLevel, Long> {
    boolean existsByLevelCode(String levelCode);

    boolean existsByLevelRank(Integer levelRank);
}
