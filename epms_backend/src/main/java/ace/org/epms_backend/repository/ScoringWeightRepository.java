package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.appraisal.ScoringWeight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ScoringWeightRepository extends JpaRepository<ScoringWeight, Long> {
}
