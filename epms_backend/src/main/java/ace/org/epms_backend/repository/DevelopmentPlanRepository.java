package ace.org.epms_backend.repository;

import ace.org.epms_backend.enums.IdpStatus;
import ace.org.epms_backend.model.idp.DevelopmentPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DevelopmentPlanRepository extends JpaRepository<DevelopmentPlan, Long> {
    List<DevelopmentPlan> findByEmployeeId(Long employeeId);
    List<DevelopmentPlan> findByManagerId(Long managerId);
    List<DevelopmentPlan> findByEmployeeIdOrManagerId(Long employeeId, Long managerId);
    List<DevelopmentPlan> findByStatus(IdpStatus status);
}
