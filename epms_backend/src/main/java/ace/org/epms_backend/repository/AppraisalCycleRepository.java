package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AppraisalCycleRepository extends JpaRepository<AppraisalCycle, Long> {
    List<AppraisalCycle> findByIsActiveTrue();

    Optional<AppraisalCycle> findByActiveTrue();
}
