package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.appraisal.ManagerEvaluationAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ManagerEvaluationAnswerRepository extends JpaRepository<ManagerEvaluationAnswer, Long> {

    List<ManagerEvaluationAnswer> findByEvaluation_EvaluationId(Long evaluationId);

    Optional<ManagerEvaluationAnswer> findByEvaluation_EvaluationIdAndQuestion_QuestionId(Long evaluationId, Long questionId);

    List<ManagerEvaluationAnswer> findByEvaluation_Appraisal_AppraisalId(Long appraisalId);
}

