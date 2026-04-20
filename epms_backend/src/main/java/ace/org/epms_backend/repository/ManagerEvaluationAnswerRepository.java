package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.appraisal.ManagerEvaluationAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ManagerEvaluationAnswerRepository extends JpaRepository<ManagerEvaluationAnswer, Long> {

    List<ManagerEvaluationAnswer> findByEvaluation_EvaluationId(Long evaluationId);
}
