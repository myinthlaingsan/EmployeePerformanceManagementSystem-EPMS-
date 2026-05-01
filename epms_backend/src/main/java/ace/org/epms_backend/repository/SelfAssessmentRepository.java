package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.appraisal.SelfAssessment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SelfAssessmentRepository extends JpaRepository<SelfAssessment, Long> {

    Optional<SelfAssessment> findByAppraisal_AppraisalId(Long appraisalId);
}
