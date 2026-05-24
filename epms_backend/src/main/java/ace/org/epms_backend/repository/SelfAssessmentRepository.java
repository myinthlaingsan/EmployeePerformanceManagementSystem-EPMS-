package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.appraisal.SelfAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SelfAssessmentRepository extends JpaRepository<SelfAssessment, Long> {

    Optional<SelfAssessment> findByAppraisal_AppraisalId(Long appraisalId);

    boolean existsByAppraisal_Employee_IdAndAppraisal_Cycle_CycleId(Long employeeId, Long cycleId);

    @Query("SELECT DISTINCT sa.appraisal.employee.id FROM SelfAssessment sa WHERE sa.appraisal.cycle.cycleId = ?1")
    List<Long> findEmployeeIdsByCycleId(Long cycleId);

    long countByAppraisal_Cycle_CycleId(Long cycleId);
}
