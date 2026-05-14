package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.kpi.KpiFinalScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface KpiFinalScoreRepository extends JpaRepository<KpiFinalScore, Long> {
    // Optional<KpiFinalScore> findByEmployeeIdAndCycleId(Long employeeId, Long
    // cycleId);

    Optional<KpiFinalScore> findByEmployee_IdAndGoalSet_Cycle_CycleId(Long employeeId, Long cycleId);

    Optional<KpiFinalScore> findByAppraisal_AppraisalId(Long appraisalId);
}
