package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.appraisal.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByCategory_CategoryId(Long categoryId);

    List<Question> findByCategory_Form_FormId(Long formId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Question q WHERE q.category.form.formId = :formId")
    void deleteByFormId(Long formId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Question q WHERE q.category.categoryId = :categoryId")
    void deleteByCategoryId(Long categoryId);
}
