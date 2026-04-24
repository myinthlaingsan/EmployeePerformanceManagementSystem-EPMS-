package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.pip.PipProgressLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PipProgressRepository extends JpaRepository<PipProgressLog, Long> {

    List<PipProgressLog> findByObjective_ObjectiveId(Long objectiveId);
}
