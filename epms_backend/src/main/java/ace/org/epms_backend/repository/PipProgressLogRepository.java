package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.pip.PipProgressLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PipProgressLogRepository extends JpaRepository<PipProgressLog, Long> {

    List<PipProgressLog> findByObjective_ObjectiveId(Long objectiveId);
}
