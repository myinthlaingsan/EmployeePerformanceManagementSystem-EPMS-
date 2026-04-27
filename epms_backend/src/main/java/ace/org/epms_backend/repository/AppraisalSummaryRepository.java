package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.appraisal.AppraisalSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AppraisalSummaryRepository extends JpaRepository<AppraisalSummary, Long> {
    Optional<AppraisalSummary> findByEmployeeIdAndCycle_CycleId(Long employeeId, Long cycleId);
}
