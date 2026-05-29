package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.kpi.KpiMidcycleFinalScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KpiMidcycleFinalScoreRepository extends JpaRepository<KpiMidcycleFinalScore, Long> {
    Optional<KpiMidcycleFinalScore> findByEmployee_IdAndCycle_CycleId(Long employeeId, Long cycleId);
}
