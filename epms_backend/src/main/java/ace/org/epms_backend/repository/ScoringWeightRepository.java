package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.appraisal.ScoringWeight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ScoringWeightRepository extends JpaRepository<ScoringWeight, Long> {
    Optional<ScoringWeight> findByCycle_CycleId(Long cycleId);
}
