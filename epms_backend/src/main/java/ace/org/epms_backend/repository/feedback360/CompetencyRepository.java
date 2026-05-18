package ace.org.epms_backend.repository.feedback360;

import ace.org.epms_backend.model.feedback360.Competency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompetencyRepository extends JpaRepository<Competency, Long> {
    List<Competency> findByIsActiveTrue();
}
