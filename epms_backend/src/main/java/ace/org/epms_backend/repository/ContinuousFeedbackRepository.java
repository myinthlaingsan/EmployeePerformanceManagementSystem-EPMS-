package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.continuous.ContinuousFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContinuousFeedbackRepository extends JpaRepository<ContinuousFeedback, Long> {
    List<ContinuousFeedback> findByEmployee_Id(Long employeeId);
    List<ContinuousFeedback> findByManager_Id(Long managerId);
}
