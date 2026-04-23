package ace.org.epms_backend.repository.appraisal;

import ace.org.epms_backend.model.appraisal.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
}
