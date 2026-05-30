package ace.org.epms_backend.repository;

import ace.org.epms_backend.enums.CycleStatus;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AppraisalCycleRepository extends JpaRepository<AppraisalCycle, Long> {
    List<AppraisalCycle> findByIsActiveTrueOrderByCycleIdDesc();

    @Query("SELECT c FROM AppraisalCycle c WHERE c.isActive = true AND (c.status IN :statuses OR c.status IS NULL) ORDER BY c.cycleId DESC")
    List<AppraisalCycle> findActiveCyclesByStatus(@Param("statuses") List<CycleStatus> statuses);

    List<AppraisalCycle> findByEndDateAndIsActiveTrue(LocalDate endDate);

    List<AppraisalCycle> findAllByOrderByEndDateDesc();

    // --- Scheduler queries ---
    List<AppraisalCycle> findByIsActiveTrueAndStatus(CycleStatus status);

    long countByFinancialYear_IdAndIsActiveTrue(Long financialYearId);

    @Query("SELECT c FROM AppraisalCycle c WHERE c.isActive = true AND c.status = :status AND c.startDate <= :date")
    List<AppraisalCycle> findCyclesReadyForInProgress(@Param("status") CycleStatus status, @Param("date") LocalDate date);

    @Query("SELECT c FROM AppraisalCycle c WHERE c.isActive = true AND c.status = :status AND c.selfAssessmentDeadline <= :date")
    List<AppraisalCycle> findCyclesReadyForEvaluation(@Param("status") CycleStatus status, @Param("date") LocalDate date);

    @Query("SELECT c FROM AppraisalCycle c WHERE c.isActive = true AND c.endDate <= :date")
    List<AppraisalCycle> findCyclesDueForClosure(@Param("date") LocalDate date);

    @Query("SELECT c FROM AppraisalCycle c WHERE c.isActive = true AND c.endDate = :date")
    List<AppraisalCycle> findCyclesClosingOn(@Param("date") LocalDate date);
}
