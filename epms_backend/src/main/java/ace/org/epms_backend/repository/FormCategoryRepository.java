package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.appraisal.FormCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FormCategoryRepository extends JpaRepository<FormCategory, Long> {

    List<FormCategory> findByForm_FormId(Long formId);
}
