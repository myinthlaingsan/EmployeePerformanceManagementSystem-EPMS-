package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.appraisal.AppraisalHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppraisalHistoryRepository extends JpaRepository<AppraisalHistory, Long> {

    List<AppraisalHistory> findByEmployee_Id(Long employeeId);

    List<AppraisalHistory> findByCycle_CycleId(Long cycleId);
}
