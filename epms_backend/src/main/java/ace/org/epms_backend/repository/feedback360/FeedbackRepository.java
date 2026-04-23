package ace.org.epms_backend.repository.feedback360;

import ace.org.epms_backend.model.feedback360.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
}
