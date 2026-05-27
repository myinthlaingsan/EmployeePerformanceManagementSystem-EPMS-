package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.idp.DevelopmentGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DevelopmentGoalRepository extends JpaRepository<DevelopmentGoal, Long> {
    List<DevelopmentGoal> findByPlan_IdpId(Long idpId);
}
