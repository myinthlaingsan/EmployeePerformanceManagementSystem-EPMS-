package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.appraisal.ManagerEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ManagerEvaluationRepository extends JpaRepository<ManagerEvaluation, Long> {

    Optional<ManagerEvaluation> findByAppraisal_AppraisalId(Long appraisalId);
}
