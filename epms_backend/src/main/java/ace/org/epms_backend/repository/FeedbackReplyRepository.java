package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.continuous.FeedbackReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackReplyRepository extends JpaRepository<FeedbackReply, Long> {
    List<FeedbackReply> findByFeedback_FeedbackId(Long feedbackId);
}
