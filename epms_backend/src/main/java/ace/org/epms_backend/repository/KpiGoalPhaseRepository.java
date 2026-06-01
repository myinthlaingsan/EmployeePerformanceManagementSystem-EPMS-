package ace.org.epms_backend.repository;

import ace.org.epms_backend.enums.PhaseStatus;
import ace.org.epms_backend.model.kpi.KpiGoalPhase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KpiGoalPhaseRepository extends JpaRepository<KpiGoalPhase, Long> {
    List<KpiGoalPhase> findByEmployee_IdAndCycle_CycleIdOrderByPhaseNumberAsc(Long employeeId, Long cycleId);
    
    Optional<KpiGoalPhase> findByEmployee_IdAndCycle_CycleIdAndStatus(Long employeeId, Long cycleId, PhaseStatus status);
    
    // Get the latest (most recent) OPEN phase by phase number to avoid ambiguity
    Optional<KpiGoalPhase> findFirstByEmployee_IdAndCycle_CycleIdAndStatusOrderByPhaseNumberDesc(Long employeeId, Long cycleId, PhaseStatus status);
    
    boolean existsByEmployee_IdAndCycle_CycleId(Long employeeId, Long cycleId);
}
