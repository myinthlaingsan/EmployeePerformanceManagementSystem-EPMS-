package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.employee.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PositionRepository extends JpaRepository<Position, Long> {
    boolean existsByPositionCode(String positionCode);
    List<Position> findByLevel_LevelId(Long levelId);
}
