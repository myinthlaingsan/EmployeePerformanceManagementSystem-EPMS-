package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.employee.Position;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PositionRepository extends JpaRepository<Position,Long> {
}
