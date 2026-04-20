package ace.org.epms_backend.repository.feedback360;

import ace.org.epms_backend.model.feedback360.FeedbackRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FeedbackRequestRepository extends JpaRepository<FeedbackRequest, Long> {

}