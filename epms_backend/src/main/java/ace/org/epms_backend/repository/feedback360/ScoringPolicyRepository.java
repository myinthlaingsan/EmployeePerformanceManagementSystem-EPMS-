package ace.org.epms_backend.repository.feedback360;

import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.employee.JobLevel;
import ace.org.epms_backend.model.feedback360.ScoringPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ScoringPolicyRepository extends JpaRepository<ScoringPolicy, Long> {

    Optional<ScoringPolicy> findByCycleAndJobLevel(AppraisalCycle cycle, JobLevel jobLevel);

    // Cycle-wide default: the row with jobLevel = null
    @Query("SELECT sp FROM ScoringPolicy sp WHERE sp.cycle = :cycle AND sp.jobLevel IS NULL")
    Optional<ScoringPolicy> findCycleDefault(@Param("cycle") AppraisalCycle cycle);
}
