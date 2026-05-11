package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AppraisalCycleRepository extends JpaRepository<AppraisalCycle, Long> {
    List<AppraisalCycle> findByIsActiveTrue();

    List<AppraisalCycle> findByEndDateAndIsActiveTrue(LocalDate endDate);

    List<AppraisalCycle> findAllByOrderByEndDateDesc();
}
