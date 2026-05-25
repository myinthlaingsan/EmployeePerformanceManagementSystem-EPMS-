package ace.org.epms_backend.repository.calibration;

import ace.org.epms_backend.model.calibration.CalibrationSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CalibrationSessionRepository extends JpaRepository<CalibrationSession, Long> {
    List<CalibrationSession> findByCycleCycleId(Long cycleId);
}
