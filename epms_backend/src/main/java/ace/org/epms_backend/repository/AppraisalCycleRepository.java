package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import org.springframework.data.jpa.repository.JpaRepository;
<<<<<<< HEAD
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AppraisalCycleRepository extends JpaRepository<AppraisalCycle, Long> {
    Optional<AppraisalCycle> findByIsActiveTrue();
=======

import java.util.List;

public interface AppraisalCycleRepository extends JpaRepository<AppraisalCycle, Long> {
    List<AppraisalCycle> findByIsActiveTrue();
>>>>>>> origin/minkhant
}
