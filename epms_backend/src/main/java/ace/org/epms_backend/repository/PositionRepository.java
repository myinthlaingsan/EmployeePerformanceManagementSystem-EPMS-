package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.employee.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PositionRepository extends JpaRepository<Position, Long> {
    boolean existsByPositionCode(String positionCode);

    List<Position> findByLevel_LevelId(Long levelId);
}
