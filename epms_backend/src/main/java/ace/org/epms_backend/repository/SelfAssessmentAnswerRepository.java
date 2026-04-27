package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.appraisal.SelfAssessmentAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SelfAssessmentAnswerRepository extends JpaRepository<SelfAssessmentAnswer, Long> {

    List<SelfAssessmentAnswer> findBySelfAssessment_SelfAssessmentId(Long selfAssessmentId);

    Optional<SelfAssessmentAnswer> findBySelfAssessment_SelfAssessmentIdAndQuestion_QuestionId(Long selfAssessmentId, Long questionId);
}
