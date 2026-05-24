package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.appraisal.AppraisalSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppraisalSummaryRepository extends JpaRepository<AppraisalSummary, Long> {
    Optional<AppraisalSummary> findByEmployee_IdAndCycle_CycleId(Long employeeId, Long cycleId);
    List<AppraisalSummary> findByCycle_CycleId(Long cycleId);

    List<AppraisalSummary> findByEmployee_Id(Long employeeId);
}

