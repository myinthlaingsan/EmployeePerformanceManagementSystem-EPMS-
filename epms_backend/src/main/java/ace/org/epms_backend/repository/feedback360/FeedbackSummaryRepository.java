package ace.org.epms_backend.repository.feedback360;

import ace.org.epms_backend.model.feedback360.FeedbackSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackSummaryRepository extends JpaRepository<FeedbackSummary, Long> {
    Optional<FeedbackSummary> findByEmployeeIdAndCycleCycleId(Long employeeId, Long cycleId);
    List<FeedbackSummary> findByCycleCycleId(Long cycleId);
}
