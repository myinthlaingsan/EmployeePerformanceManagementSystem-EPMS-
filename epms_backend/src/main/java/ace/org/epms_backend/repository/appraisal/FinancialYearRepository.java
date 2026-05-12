package ace.org.epms_backend.repository.appraisal;

import ace.org.epms_backend.model.appraisal.FinancialYear;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FinancialYearRepository extends JpaRepository<FinancialYear, Long> {
    Optional<FinancialYear> findByIsCurrentTrue();
    boolean existsByTitle(String title);
}
