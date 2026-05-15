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
}
