package ace.org.epms_backend.repository.feedback360;

import ace.org.epms_backend.model.feedback360.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    Optional<Feedback> findByRequestId(Long requestId);
    List<Feedback> findByRequestEvaluatorId(Long evaluatorId);
    List<Feedback> findByRequestTargetUserIdAndRequestCycleCycleId(Long targetUserId, Long cycleId);

    @Query("SELECT DISTINCT f.request.targetUser.id FROM Feedback f WHERE f.request.cycle.cycleId = :cycleId")
    List<Long> findDistinctTargetUserIdsByCycle(@Param("cycleId") Long cycleId);
}
