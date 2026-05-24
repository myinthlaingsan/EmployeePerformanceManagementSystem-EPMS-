package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.appraisal.FormCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface FormCategoryRepository extends JpaRepository<FormCategory, Long> {

    List<FormCategory> findByForm_FormId(Long formId);

    @Modifying
    @Transactional
    @Query("DELETE FROM FormCategory c WHERE c.form.formId = :formId")
    void deleteByFormId(Long formId);
}
