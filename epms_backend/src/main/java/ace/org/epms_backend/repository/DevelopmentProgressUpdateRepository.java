package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.idp.DevelopmentProgressUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DevelopmentProgressUpdateRepository extends JpaRepository<DevelopmentProgressUpdate, Long> {
    List<DevelopmentProgressUpdate> findByGoal_GoalIdOrderByCreatedAtDesc(Long goalId);
    Optional<DevelopmentProgressUpdate> findFirstByGoal_GoalIdOrderByCreatedAtDesc(Long goalId);
}
