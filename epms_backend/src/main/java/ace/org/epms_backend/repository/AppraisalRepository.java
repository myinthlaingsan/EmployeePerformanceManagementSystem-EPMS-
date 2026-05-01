package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.appraisal.Appraisal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AppraisalRepository extends JpaRepository<Appraisal, Long> {
    List<Appraisal> findByEmployee_Id(Long employeeId);
    List<Appraisal> findByManager_Id(Long managerId);
    List<Appraisal> findByCycle_CycleId(Long cycleId);
    Optional<Appraisal> findByEmployee_IdAndCycle_CycleId(Long employeeId, Long cycleId);
    List<Appraisal> findAllByEmployee_IdAndCycle_CycleId(Long employeeId, Long cycleId);
}
