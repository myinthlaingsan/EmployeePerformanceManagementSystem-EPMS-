package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.appraisal.ManagerEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ManagerEvaluationRepository extends JpaRepository<ManagerEvaluation, Long> {

    Optional<ManagerEvaluation> findByAppraisal_AppraisalId(Long appraisalId);

    long countByAppraisal_Employee_IdAndAppraisal_Cycle_CycleId(Long employeeId, Long cycleId);

    long countByAppraisal_Manager_IdAndAppraisal_Cycle_CycleId(Long managerId, Long cycleId);

    @Query("SELECT DISTINCT me.appraisal.employee.id FROM ManagerEvaluation me WHERE me.appraisal.manager.id = ?1 AND me.appraisal.cycle.cycleId = ?2")
    List<Long> findEmployeeIdsByManagerIdAndCycleId(Long managerId, Long cycleId);

    @Query("SELECT DISTINCT me.appraisal.manager.id FROM ManagerEvaluation me WHERE me.appraisal.cycle.cycleId = ?1")
    List<Long> findDistinctManagerIdsByCycleId(Long cycleId);

    Optional<ManagerEvaluation> findTopByAppraisal_Employee_IdOrderByCreatedAtDesc(Long employeeId);

    long countByAppraisal_Cycle_CycleId(Long cycleId);

    boolean existsByAppraisal_Employee_IdAndAppraisal_Cycle_CycleId(Long employeeId, Long cycleId);
}
