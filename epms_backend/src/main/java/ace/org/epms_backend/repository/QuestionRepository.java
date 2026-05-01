package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.appraisal.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByCategory_CategoryId(Long categoryId);

    List<Question> findByCategory_Form_FormId(Long formId);
}
