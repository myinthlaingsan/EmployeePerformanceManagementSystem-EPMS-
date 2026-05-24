package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.continuous.FeedbackTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FeedbackTagRepository extends JpaRepository<FeedbackTag, Long> {
    boolean existsByTagNameIgnoreCase(String tagName);
}
