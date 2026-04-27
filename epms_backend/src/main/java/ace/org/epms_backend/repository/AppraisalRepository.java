package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.appraisal.Appraisal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppraisalRepository extends JpaRepository<Appraisal, Long> {

    List<Appraisal> findByEmployee_Id(Long employeeId);

    List<Appraisal> findByManager_Id(Long managerId);

    List<Appraisal> findByCycle_CycleId(Long cycleId);
}
