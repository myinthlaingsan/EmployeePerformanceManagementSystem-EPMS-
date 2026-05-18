package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.employee.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PositionRepository extends JpaRepository<Position, Long> {
    boolean existsByPositionCode(String positionCode);

    Optional<Position> findByPositionCode(String positionCode);

    Optional<Position> findByPositionNameIgnoreCase(String positionName);

    List<Position> findByLevel_LevelId(Long levelId);
}
