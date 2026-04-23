package ace.org.epms_backend.repository.feedback360;

import ace.org.epms_backend.model.feedback360.FeedbackResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FeedbackResponseRepository extends JpaRepository<FeedbackResponse, Long> {
}
