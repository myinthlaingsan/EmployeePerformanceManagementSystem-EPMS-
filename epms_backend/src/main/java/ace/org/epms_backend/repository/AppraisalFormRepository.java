package ace.org.epms_backend.repository;

import ace.org.epms_backend.enums.FormType;
import ace.org.epms_backend.model.appraisal.AppraisalForm;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppraisalFormRepository extends JpaRepository<AppraisalForm, Long> {
    boolean existsByCycleCycleIdAndFormType(Long cycleId, FormType formType);
}
