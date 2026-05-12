package ace.org.epms_backend.repository.feedback360;

import ace.org.epms_backend.model.feedback360.GlobalFeedbackConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GlobalFeedbackConfigRepository extends JpaRepository<GlobalFeedbackConfig, Long> {
    Optional<GlobalFeedbackConfig> findFirstByIsActiveTrue();
}
