package ace.org.epms_backend.repository.calibration;

import ace.org.epms_backend.model.calibration.CalibrationSessionSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CalibrationSessionSummaryRepository extends JpaRepository<CalibrationSessionSummary, Long> {
    List<CalibrationSessionSummary> findBySessionId(Long sessionId);
    List<CalibrationSessionSummary> findBySummaryId(Long summaryId);
}
