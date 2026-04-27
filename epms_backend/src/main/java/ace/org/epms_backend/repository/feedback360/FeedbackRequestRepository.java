package ace.org.epms_backend.repository.feedback360;

import ace.org.epms_backend.enums.FeedbackStatus;
import ace.org.epms_backend.model.feedback360.FeedbackRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRequestRepository extends JpaRepository<FeedbackRequest, Long> {
    List<FeedbackRequest> findByEvaluatorIdAndStatus(Long evaluatorId, FeedbackStatus status);
    boolean existsByTargetUserIdAndEvaluatorIdAndCycleCycleId(Long targetUserId, Long evaluatorId, Long cycleId);
    List<FeedbackRequest> findByTargetUserIdAndCycleCycleId(Long targetUserId, Long cycleId);
    List<FeedbackRequest> findByCycleCycleId(Long cycleId);
}