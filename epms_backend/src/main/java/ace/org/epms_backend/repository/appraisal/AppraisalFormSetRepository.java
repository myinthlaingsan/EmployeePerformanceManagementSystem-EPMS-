package ace.org.epms_backend.repository.appraisal;

import ace.org.epms_backend.model.appraisal.AppraisalFormSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppraisalFormSetRepository extends JpaRepository<AppraisalFormSet, Long> {
    List<AppraisalFormSet> findByCycle_CycleId(Long cycleId);
    List<AppraisalFormSet> findByIsActiveTrue();
    boolean existsByCycle_CycleIdAndName(Long cycleId, String name);
}
