package ace.org.epms_backend.repository.feedback360;

import ace.org.epms_backend.model.feedback360.FeedbackDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FeedbackDraftRepository extends JpaRepository<FeedbackDraft, Long> {
    Optional<FeedbackDraft> findByRequestIdAndEvaluatorId(Long requestId, Long evaluatorId);
}
