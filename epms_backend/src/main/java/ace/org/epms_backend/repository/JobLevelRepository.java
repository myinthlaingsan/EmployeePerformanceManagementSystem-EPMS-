package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.employee.JobLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobLevelRepository extends JpaRepository<JobLevel, Long> {
    boolean existsByLevelCode(String levelCode);
    List<JobLevel> findAllByOrderByLevelIdAsc();
    boolean existsByLevelRank(Integer levelRank);
}
